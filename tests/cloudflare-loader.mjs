const cloudflareStub =
  "data:text/javascript,export%20const%20env%20%3D%20Object.freeze(%7B%7D)%3B";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return { url: cloudflareStub, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
