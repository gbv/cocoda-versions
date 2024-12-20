#!/usr/bin/env zx

await $`node --version`
await $`npm --version`

if (!await fs.pathExists("cocoda")) {
  await $`mkdir cocoda`
}
await cd("cocoda")

if (!await fs.pathExists(".git")) {
  await $`git clone https://github.com/gbv/cocoda.git .`
}

if (!await fs.pathExists("node_modules")) {
  await $`npm ci`
}

// Determine tags
const tags = new Set(process.env.TAGS ? process.env.TAGS.split(" ") : ["all"])
if (tags.has("all")) {
  tags.delete("all")
  const allTags = await $`git tag`
  ;`${allTags}`.split("\n").filter(Boolean).forEach(tag => tags.add(tag))
  tags.add("master")
  tags.add("dev")
}

const configsFolder = "/configs"
const targetFolder = "/www/cocoda"

// Target folder also contains custom configs
const customConfigs = await glob([`${configsFolder}/**/*.json`])
const instances = []
for (const configFile of customConfigs) {
  const relativePath = path.relative(configsFolder, configFile)
  let directory = path.dirname(relativePath), name = path.basename(relativePath, ".json")
  if (directory === ".") {
    directory = null
  } else {
    // Require config file to be called "cocoda.json"
    if (name !== "cocoda") {
      continue
    }
    name = directory
    directory = path.join(configsFolder, directory)
  }
  if (tags.has(name)) {
    tags.delete(name)
  }
  // Read config file
  const instance = { name, directory, configFile }
  try {
    const { _branch } = await fs.readJson(configFile)
    instance.branch = _branch || "master"
    instances.push(instance)
  } catch (error) {
    console.error(`Error: Skipping custom instance ${name} because JSON could not be parsed.`)
  }
}

// Add tags to instances
for (const tag of tags) {
  instances.push({ name: tag, branch: tag })
}

for (const { name, directory, configFile, branch } of instances) {
  console.log(`Cocoda Instance: ${name} (branch/tag: ${branch}, config: ${configFile ?? "none"})`)

  async function relinkStaticFiles() {
    if (directory) {
      console.log("- relinking static files...")
      // Link static files into root path if configuration is in a directory and includes static files
      // Note that `cocoda.json` is one of these files and doesn't need special handling.
      const files = await glob([`${directory}/**/*`])
      for (const file of files) {
        const source = file, target = path.join(targetFolder, name, path.relative(directory, file))
        if (await fs.pathExists(target)) {
          await $`rm ${target}`
        }
        await $`ln -s ${source} ${target}`
      }
    } else if (configFile) {
      // Link config file only
      console.log("- relinking config file...")
      const target = path.join(targetFolder, name, "cocoda.json")
      if (await fs.pathExists(target)) {
        await $`rm ${target}`
      }
      await $`ln -s ${configFile} ${target}`
    }
  }

  try {
    if (await fs.pathExists(`${targetFolder}/${name}`)) {
      // No updates for non-branches
      if (branch.match(/^\d/)) {
        console.log("- instance already built and no updates necessary")
        await relinkStaticFiles()
        continue
      }

      // Determine target commit via build-info.json to compare with current commit
      let buildCommit
      try {
        const buildInfo = await fs.readJson(`${targetFolder}/${name}/build-info.json`)
        buildCommit = buildInfo.gitCommit
      } catch (error) {
        // Ignore = empty buildCommit means we'll build it anyways
      }
      
      // Checkout branch and pull changes
      await $`git checkout ${branch}`
      await $`git pull`

      // Get current commit and compare with build commit
      const currentCommit = `${await $`git rev-parse --verify HEAD`.quiet()}`.trim()

      if (currentCommit === buildCommit) {
        console.log("- instance already built and no updates necessary")
        await relinkStaticFiles()
        continue
      }

      console.log(`- There's an update to branch ${branch} or built instance is not up-to-date. Rebuilding Cocoda...`)
    }
    // Build version via build-all.sh script
    await $`./build/build-all.sh ${branch}`
    // Move files to target folder
    if (await fs.pathExists(`${targetFolder}/${name}`)) {
      await $`rm -r ${targetFolder}/${name}`
    }
    await $`mv releases/${branch} ${targetFolder}/${name}`
    await relinkStaticFiles()
    console.log(`- Successfully built instance ${name}!`)
  } catch (error) {
    console.error(`- Error building instance ${name}: ${error}`)
  }
}

// Update builds.json file
const builds = {}
console.log("Creating builds.json file...")
for (const { name } of instances) {
  const buildInfoFile = `${targetFolder}/${name}/build-info.json`
  try {
    const buildInfo = await fs.readJson(buildInfoFile)
    builds[name] = buildInfo
  } catch (_error) {
    console.warn(`- Warning: Could not read build-info.json for instance ${name}.`)
  }
}
await fs.writeJSON(`${targetFolder}/builds.json`, builds, { spaces: 2 })
