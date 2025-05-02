// This file configures the testing environment for Jest

// Make TypeScript recognize the Jest globals
import '@types/jest';

// These are already defined by Jest, so we don't need to redefine them
// The TypeScript errors are just because TypeScript doesn't know they exist
// Adding the @types/jest import above should fix most of the issues
