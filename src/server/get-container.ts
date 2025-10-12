import { createServerContainer, type ServerContainer } from "@/server/container";

let cachedContainer: ServerContainer | null = null;

export function getServerContainer(): ServerContainer {
  if (!cachedContainer) {
    cachedContainer = createServerContainer();
  }
  return cachedContainer;
}
