import { resolve as resolveTs } from 'ts-node/esm'
import { pathToFileURL } from 'url'

export async function resolve(specifier, context, defaultResolver) {
  const { parentURL = pathToFileURL(process.cwd()) } = context

  const resolved = await resolveTs(specifier, context, defaultResolver)
  return resolved
}

export { load, transformSource } from 'ts-node/esm'

