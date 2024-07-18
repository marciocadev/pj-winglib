import { cdk, javascript } from 'projen';
import { WinglibProject } from './src/winglibs';

const project = new cdk.JsiiProject({
  author: 'Marcio Cruz de Almeida',
  authorAddress: 'marciocadev@gmail.com',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.4.0',
  name: 'pj-winglib',
  packageManager: javascript.NodePackageManager.NPM,
  projenrcTs: true,
  repositoryUrl: 'https://github.com/marciocadev/pj-winglib.git',

  // basic licence
  license: 'MIT',
  copyrightOwner: 'Wing',
  copyrightPeriod: '2023',

  // avoid create src/ and test/ folder and files
  sampleCode: false,

  // remove every file from .github/workflows
  pullRequestTemplate: false,
  buildWorkflow: false,
  githubOptions: {
    pullRequestLint: false,
  },
  release: false,
  depsUpgrade: false,
});

const WINGLIBS = [
  'dynamodb',
  'checks',
];

for (const lib of WINGLIBS) {
  const subProject = new WinglibProject({
    name: lib,
    parent: project,
    outdir: lib,
    gitIgnoreOptions: {
      ignorePatterns: ["target/", "node_modules/"]
    },
    github: project.github!
  });

  subProject.synth();
}

project.synth();