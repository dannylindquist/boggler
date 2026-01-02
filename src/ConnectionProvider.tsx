import { Handle, RemixNode } from "@remix-run/component";
import { ConnectionModal } from "./connection";

export function ConnectionProvider(
  this: Handle<ConnectionModal>,
  { connection }: { connection: ConnectionModal }
) {
  this.context.set(connection);
  return ({ children }: { children: RemixNode }) => children;
}
