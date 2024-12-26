import * as tf from "@tensorflow/tfjs";
import { eq } from "drizzle-orm";
import type { AtContext } from "../context";
import { tfjsModels } from "../db/schema";
import { toArrayBuffer } from "./buffer-to-arraybuffer";

type ModelMetadata = Omit<tf.io.ModelJSON, "modelTopology" | "weightsManifest">;
type ModelBundle = {
  modelInfo: tf.io.ModelArtifactsInfo;
  modelTopology: Record<string, unknown>;
  weightSpecs: tf.io.WeightsManifestEntry[];
  weightData: string;
  modelMetadata: ModelMetadata;
};

type Options = {
  ctx: AtContext;
  modelName: string;
  wordIndex?: Record<string, number>;
  uniqueWords?: Array<string>;
};

// Custom IOHandler for TensorflowJS for storing inside of our drizzle-orm postgres
export class ModelPersistance implements tf.io.IOHandler {
  ctx: AtContext;
  modelName: string;
  wordIndex?: Record<string, number>;
  uniqueWords?: Array<string>;

  constructor(args: Options) {
    this.ctx = args.ctx;
    this.modelName = args.modelName;
    this.uniqueWords = args.uniqueWords;
    this.wordIndex = args.wordIndex;
  }

  async save(mfa: tf.io.ModelArtifacts): Promise<tf.io.SaveResult> {
    if (!this.wordIndex || !this.uniqueWords) {
      throw new Error("Cannot save without wordIndex and uniqueWords atm");
    }
    if (!mfa.modelTopology) {
      throw new Error("no modelTopology");
    }
    if (!mfa.weightData) {
      throw new Error("no modelArtifacts.weightData");
    }

    const bundle: Partial<ModelBundle> = {};

    // Model info
    const weightsManifest: tf.io.WeightsManifestConfig = [
      {
        paths: ["./model.weights.bin"], //this is copied and meaningless here what whatev
        weights: mfa.weightSpecs || [],
      },
    ];

    const modelJSON: tf.io.ModelJSON = {
      modelTopology: mfa.modelTopology,
      format: mfa.format,
      generatedBy: mfa.generatedBy,
      convertedBy: mfa.convertedBy,
      userDefinedMetadata: mfa.userDefinedMetadata,
      weightsManifest,
    };

    await this.ctx.db
      .insert(tfjsModels)
      .values({
        name: this.modelName,
        model: modelJSON,
        weights: Buffer.from(mfa.weightData),
        uniqueWords: this.uniqueWords,
        wordIndex: this.wordIndex,
      })
      .onConflictDoUpdate({
        target: tfjsModels.name,
        set: {
          model: modelJSON,
          weights: Buffer.from(mfa.weightData),
          uniqueWords: this.uniqueWords,
          wordIndex: this.wordIndex,
        },
      });

    const saveResult: tf.io.SaveResult = {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: "JSON",
        modelTopologyBytes: (mfa.modelTopology as ArrayBuffer).byteLength,
        weightDataBytes: (mfa.weightData as ArrayBuffer).byteLength,
      },
    };

    return saveResult;
  }

  async load(): Promise<tf.io.ModelArtifacts> {
    const res = await this.ctx.db
      .select()
      .from(tfjsModels)
      .where(eq(tfjsModels.name, this.modelName));
    if (!res || !res[0]) throw new Error("No model found, cannot load");
    const mres = res[0];
    const modelConfig = mres.model;

    // Store vocabolary on instance, helpful for classifying
    this.uniqueWords = mres.uniqueWords;
    this.wordIndex = mres.wordIndex;

    const modelTopology = modelConfig.modelTopology;
    const weightsManifest = modelConfig.weightsManifest;
    const generatedBy = modelConfig.generatedBy;
    const convertedBy = modelConfig.convertedBy;
    const format = modelConfig.format;
    const userDefinedMetadata = modelConfig.userDefinedMetadata;

    // We do not allow both modelTopology and weightsManifest to be missing.
    if (modelTopology == null && weightsManifest == null) {
      throw new Error(
        `The JSON contains neither model ` + `topology or manifest for weights.`
      );
    }

    return {
      modelTopology,
      weightSpecs: mres.model.weightsManifest[0].weights,
      weightData: toArrayBuffer(mres.weights),
      userDefinedMetadata,
      generatedBy,
      convertedBy,
      format,
    };
  }
}
