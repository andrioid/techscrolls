import type { AtContext } from "../context";
import { LISTEN_NOTIFY_NEW_SUBSCRIBERS } from "./jetstream-subscription";

export async function notifyNewSubscribers(ctx: AtContext) {
  return ctx.db.$client.notify(LISTEN_NOTIFY_NEW_SUBSCRIBERS, ""); // Tells the queue process
}
