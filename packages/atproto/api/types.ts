import type { AtContext } from "../context";

export type HandlerFn = (req: Request, ctx: AtContext) => Promise<Response>;
