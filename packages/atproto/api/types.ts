import type { AppContext } from "../context";

export type HandlerFn = (req: Request, ctx: AppContext) => Promise<Response>;
