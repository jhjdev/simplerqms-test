import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// Register the ts-node/esm loader for TypeScript files
register('ts-node/esm', pathToFileURL('./'))

