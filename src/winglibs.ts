import { existsSync } from 'fs';
import { License, Project, ProjectOptions, SourceCode, TextFile } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';

export interface WinglibProjectOptions extends ProjectOptions {
  github: GitHub;
}

export class WinglibProject extends Project {
  github: GitHub;

  constructor(options: WinglibProjectOptions) {
    super(options);
    this.github = options.github;

    new License(this, {
      copyrightOwner: 'wing',
      copyrightPeriod: '2023',
      spdx: 'MIT',
    });

    this.addPackageJson();
    this.addReadme();
    this.addSourceFile();
    this.addTestFile();
    this.addPullRequest();
    this.addRelease();
  }

  private addRelease() {
    const gitWorkflow = new GithubWorkflow(this.github, `${this.name}-release`);
    gitWorkflow.on({
      push: {
        branches: ['main'],
        paths: [`${this.name}/**`, `"!${this.name}/package-lock.json"`],
      },
    });
    gitWorkflow.addJob(`build-${this.name}`, {
      runsOn: ['ubuntu-latest'],
      permissions: {
        contents: JobPermission.WRITE,
      },
      steps: [
        {
          name: 'Checkout',
          uses: 'actions/checkout@v3',
          with: {
            'sparse-checkout': this.name,
          },
        },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v3',
          with: {
            'node-version': '20.x',
            'registry-url': 'https://registry.npmjs.org',
          },
        },
        {
          name: 'Install winglang',
          run: 'npm i -g winglang',
        },
        {
          name: 'Install dependencies',
          run: 'npm i --include=dev',
          workingDirectory: this.name,
        },
        {
          name: 'Test',
          run: 'wing test',
          workingDirectory: this.name,
        },
        {
          name: 'Pack',
          run: 'wing pack',
          workingDirectory: this.name,
        },
        {
          name: 'Get package version',
          run: 'echo WINGLIB_VERSION=$(node -p "require(\'./package.json\').version") >> "$GITHUB_ENV"',
          workingDirectory: this.name,
        },
        {
          name: 'Echo WINGLIB_VERSION',
          run: 'echo $WINGLIB_VERSION',
        },
        {
          name: 'Publish',
          run: 'npm publish --access=public --registry https://registry.npmjs.org --tag latest *.tgz',
          workingDirectory: this.name,
          env: {
            NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}',
          },
        },
        {
          name: 'Tag commit',
          uses: 'tvdias/github-tagger@v0.0.1',
          with: {
            'repo-token': '${{ secrets.PROJEN_GITHUB_TOKEN }}',
            'tag': `${this.name}-v$\{\{ env.WINGLIB_VERSION \}\}`,
          },
        },
        {
          name: 'Github release',
          uses: 'softprops/action-gh-release@v1',
          with: {
            name: `${this.name} v$\{\{ env.WINGLIB_VERSION \}\}`,
            tag_name: `${this.name}-v$\{\{ env.WINGLIB_VERSION \}\}`,
            files: '*.tgz',
            token: 'v${{ env.PROJEN_GITHUB_TOKEN }}',
          },
        },
      ],
    });
  }

  private addPullRequest() {
    const gitWorkflow = new GithubWorkflow(this.github, `${this.name}-pull`);
    gitWorkflow.on({
      pullRequest: {
        paths: [`${this.name}/**`],
      },
    });
    gitWorkflow.addJob(`build-${this.name}`, {
      runsOn: ['ubuntu-latest'],
      permissions: {},
      steps: [
        {
          name: 'Checkout',
          uses: 'actions/checkout@v3',
          with: {
            'sparse-checkout': this.name,
          },
        },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v3',
          with: {
            'node-version': '20.x',
            'registry-url': 'https://registry.npmjs.org',
          },
        },
        {
          name: 'Install winglang',
          run: 'npm i -g winglang',
        },
        {
          name: 'Install dependencies',
          run: 'npm i --include=dev',
          workingDirectory: this.name,
        },
        {
          name: 'Test',
          run: 'wing test',
          workingDirectory: this.name,
        },
        {
          name: 'Pack',
          run: 'wing pack',
          workingDirectory: this.name,
        },
      ],
    });
  }

  private addTestFile() {
    if (!existsSync(`${this.outdir}/tests/${this.name}.test.w`)) {
      const testfile = new SourceCode(this, `tests/${this.name}.test.w`, { readonly: false });
      testfile.line('bring expect;');
      testfile.line(`bring "../${this.name}.w" as l;`);
      testfile.line('');
      testfile.line('let adder = new l.Adder();');
      testfile.line('');
      testfile.line('test "add() adds two numbers" {');
      testfile.line('  expect.equal(adder.add(1, 2), 3);');
      testfile.line('}');
    }
  }

  private addSourceFile() {
    if (!existsSync(`${this.outdir}/${this.name}.w`)) {
      const sourceFile = new SourceCode(this, `${this.name}.w`, { readonly: false });
      sourceFile.line('pub class Adder {');
      sourceFile.line('  pub inflight add (x: num, y: num): num {');
      sourceFile.line('    return x + y;');
      sourceFile.line('  }');
      sourceFile.line('}');
    }
  }

  private addReadme() {
    new TextFile(this, 'README.md', {
      readonly: false,
      lines: [
        `# ${this.name}`,
        '',
        '## Prerequisites',
        '',
        '* [winglang](https://winglang.io).',
        '',
        '## Installation',
        '',
        '\`\`\`sh',
        `npm i @winglibs/${this.name}`,
        '\`\`\`',
        '',
        '## Usage',
        '',
        '\`\`\`sh',
        `bring ${this.name};`,
        '',
        `let adder = new ${this.name}.Adder();`,
        '\`\`\`',
        '',
        '## Licence',
        '',
        'This library is licensed under the [MIT License](./LICENSE).',
      ],
    });
  }

  private addPackageJson() {
    new TextFile(this, 'package.json', {
      readonly: false,
      lines: [
        '{',
        `  "name": "@marciocadev/${this.name}",`,
        `  "description": "${this.name} library for Wing",`,
        '  "version": "0.0.1",',
        '  "repository": {',
        '    "type": "git",',
        '    "url": "https://github.com/marciocadev/pj-winglib.git",',
        `    "directory": "${this.name}"`,
        '  },',
        '  "author": {',
        '    "name": "Marcio Cruz de Almeida",',
        '    "email": "marciocadev@gmail.com"',
        '  },',
        '  "wing": {',
        '    "platforms": [',
        '      "sim"',
        '    ]',
        '  },',
        '  "license": "MIT"',
        '}',
      ],
    });
  }
}