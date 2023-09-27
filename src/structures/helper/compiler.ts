import chalk from 'chalk'
import { readFileSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'

export type compilerResult = {
  exportedClasses: string[]
  file: string
}

export async function Compiler (
  path: string,
  of: string
): Promise<compilerResult> {
  const startCompiler = Date.now()
  const dirs = await readdir(`${path}`)

  const exportedClasses: string[] = []

  let bundledContent = ''

  let fileCount = 0
  const filesPaths = []

  for (const dir of dirs) {
    if (dir === 'bundle') continue
    const files = (await readdir(`${path}/${dir}/`)).filter(f =>
      f.endsWith('.ts')
    )

    for (const file of files) {
      if (!(await stat(`${path}/${dir}/${file}`)).isFile()) continue
      const eventContent = readFileSync(`${path}/${dir}/${file}`, 'utf-8')
      const className = eventContent.match(/export\s+class\s+(\w+)/)
      if (className && className[1]) {
        exportedClasses.push(className[1])
      }
      bundledContent += eventContent + '\n'
      fileCount++
      filesPaths.push(`${path}/${dir}/${file}`)
    }
  }

  const importRegex = /^import\s?([\w]+|\{[\s,\w]+\})\s?from\s?'[\S]+'/gm

  const imports = bundledContent.match(importRegex) || []

  const mergedImports = mergeImports(imports)

  const bundleWithOutImport = bundledContent.replace(importRegex, '')

  const formattedCode = `${mergedImports.join('\n')}\n\n${bundleWithOutImport}`

  console.trace(
    startCompiler,
    chalk.bold('Compiler finished in :'),
    chalk.bold(of.slice(0, -3))
  )

  return {
    exportedClasses,
    file:
      `./.bundle/${of}-bundle.ts` +
      `// This file is auto-generated by dtscommands.
// Do not edit this file manually.
${formattedCode}
`
  }
}

function mergeImports (imports: string[]): string[] {
  const importsData: {
    importNames: string[]
    importPath: string
    isDefault: boolean
  }[] = []

  const importRegex = /^import\s?(\{?[\w\s,]+\}?)\s?from\s?('[\S]+')/

  for (const importStatement of imports) {
    const matches = importRegex.exec(importStatement)
    if (!matches) continue
    const [, importName, importPath] = matches

    if (importName?.includes('{') && importPath) {
      // Multiple imports
      const importNames = importName
        .replace('{', '')
        .replace('}', '')
        .split(',')
        .map(i => i.trim())

      importsData.push({
        importNames,
        importPath,
        isDefault: false
      })
    } else {
      // Single import
      importsData.push({
        importNames: [importName || ''],
        importPath: importPath || '',
        isDefault: true
      })
    }
  }

  // Merge imports
  const fileredImportsData: {
    importNames: string[]
    importPath: string
    isDefault: boolean
  }[] = []

  for (const { importNames, importPath, isDefault } of importsData) {
    const existingImport = fileredImportsData.find(
      i => i.importPath === importPath
    )

    if (existingImport) {
      for (const importName of importNames) {
        if (!existingImport.importNames.includes(importName)) {
          existingImport.importNames.push(importName)
        }
      }
    } else {
      fileredImportsData.push({
        importNames,
        importPath,
        isDefault
      })
    }
  }

  const mergedImports = []

  for (const { importNames, importPath, isDefault } of fileredImportsData) {
    if (!isDefault) {
      mergedImports.push(`import {${importNames.join(',')}} from ${importPath}`)
    } else {
      mergedImports.push(`import ${importNames[0]} from ${importPath}`)
    }
  }

  return mergedImports
}

type LogType = 'info' | 'warn' | 'error' | 'debug'
const colorize = (level: LogType): string => {
  const obj = {
    info: chalk.green('INFO'),
    warn: chalk.yellow('WARN'),
    error: chalk.red('ERROR'),
    debug: chalk.whiteBright('DEBUG')
  }

  return obj[level]
}
