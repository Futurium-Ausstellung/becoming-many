import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { useBaseLayerWithoutLayersFeature } from "../../src/world/xr-session";

const scope = globalThis as { XRWebGLBinding?: unknown };

function createBinding(): { prototype: object } {
  return class {
    createProjectionLayer(): void {}
  };
}

describe("useBaseLayerWithoutLayersFeature", () => {
  let binding: { prototype: object };

  beforeEach(() => {
    binding = createBinding();
    scope.XRWebGLBinding = binding;
  });

  afterEach(() => {
    delete scope.XRWebGLBinding;
  });

  test("hides projection layers from a session without the feature", () => {
    useBaseLayerWithoutLayersFeature({ enabledFeatures: ["local-floor"] });

    expect("createProjectionLayer" in binding.prototype).toBe(false);
  });

  test("keeps projection layers for a session that enabled them", () => {
    useBaseLayerWithoutLayersFeature({ enabledFeatures: ["layers"] });

    expect("createProjectionLayer" in binding.prototype).toBe(true);
  });

  test("tolerates a browser without the binding", () => {
    delete scope.XRWebGLBinding;

    expect(() => useBaseLayerWithoutLayersFeature({})).not.toThrow();
  });
});
