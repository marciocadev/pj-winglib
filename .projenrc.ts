import { cdk, javascript } from 'projen';
const project = new cdk.JsiiProject({
  author: 'Marcio Cruz de Almeida',
  authorAddress: 'marciocadev@gmail.com',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.4.0',
  name: 'pj-winglib',
  packageManager: javascript.NodePackageManager.NPM,
  projenrcTs: true,
  repositoryUrl: 'https://github.com/marciocadev/pj-winglib.git',

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();