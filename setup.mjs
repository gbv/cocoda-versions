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

const targetFolder = "/www/cocoda"

// Target folder also contains custom configs
const customConfigs = await glob([`${targetFolder}/*.json`])
const instances = []
for (const configFile of customConfigs) {
  const name = path.basename(configFile, ".json")
  if (tags.has(name)) {
    tags.delete(name)
  }
  // Read config file
  const instance = { name, configFile }
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

const updatedBranches = new Set()

for (const { name, configFile, branch } of instances) {
  console.log(`Cocoda Instance: ${name} (branch/tag: ${branch}, config: ${configFile ?? "none"})`)
  try {
    if (await fs.pathExists(`${targetFolder}/${name}`)) {
      // No updates for non-branches
      if (branch.match(/^\d/)) {
        console.log("- instance already built and no updates necessary")
        continue
      }
      
      // Skip if there are no changes with origin
      await $`git fetch`.quiet()
      const diff = await $`git diff ${branch} origin/${branch}`.quiet()
      if (!`${diff}`.trim() && !updatedBranches.has(branch)) {
        console.log("- instance already built and no updates necessary")
        continue
      }
      updatedBranches.add(branch)
      console.log(`- There's an update to branch ${branch}. Pulling changes and rebuilding Cocoda...`)
      await $`git pull origin ${branch}`.quiet()
    }
    // Build version via build-all.sh script
    await $`./build/build-all.sh ${branch}`
    // Move files to target folder
    if (await fs.pathExists(`${targetFolder}/${name}`)) {
      await $`rm -r ${targetFolder}/${name}`
    }
    await $`mv releases/${branch} ${targetFolder}/${name}`
    // Link config file if needed
    if (configFile) {
      await $`rm ${targetFolder}/${name}/cocoda.json`
      await $`ln -s ${configFile} ${targetFolder}/${name}/cocoda.json`
    }
    console.log(`- Successfully built instance ${name}!`)
  } catch (error) {
    console.error(`- Error building instance ${name}: ${error}`)
  }
}
