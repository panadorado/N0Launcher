const { getVersionList, getFabricGames, getLoaderArtifactListFor } = require('@xmcl/installer');

// ---- Vanilla ----
// Trả về danh sách phiên bản Minecraft chính thức, gồm cả release & snapshot.
async function getVanillaVersions() {
  const list = await getVersionList();
  return list.versions.map(v => ({
    id: v.id,
    type: v.type === 'release' ? 'release' : 'snapshot',
    releaseTime: v.releaseTime,
  }));
}

async function getForgeVersionsFor(mcVersion) {
  const res = await fetch('https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml');
  if (!res.ok) throw new Error(`Không thể lấy danh sách Forge (HTTP ${res.status})`);
  const xml = await res.text();
  const all = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map(m => m[1]);

  const prefix = `${mcVersion}-`;
  return all
    .filter(v => v.startsWith(prefix))
    .map(v => v.slice(prefix.length))
    .sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pb[i] || 0) - (pa[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    })
    .map((version, i) => ({ version, type: i === 0 ? 'latest' : 'common' }));
}

async function getNeoForgeVersionsFor(mcVersion) {
  const res = await fetch('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml');
  if (!res.ok) throw new Error(`Không thể lấy danh sách NeoForge (HTTP ${res.status})`);
  const xml = await res.text();
  const all = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map(m => m[1]);

  const prefix = mcVersion.replace(/^1\./, '') + '.'; // '1.21.1' -> '21.1.'
  return all
    .filter(v => v.startsWith(prefix) && !v.includes('beta'))
    // So sánh SỐ HỌC theo từng phần (vd: 21.1.100 phải đứng trước 21.1.9),
    // so sánh string thuần sẽ xếp sai vì "100" < "9" theo ký tự.
    .sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pb[i] || 0) - (pa[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });
}

async function getFabricSupportedGameVersions() {
  return await getFabricGames(); // ['1.21.3', '1.20.1', ...]
}

async function getFabricLoaderVersionsFor(mcVersion) {
  const artifacts = await getLoaderArtifactListFor(mcVersion);
  return artifacts.map(a => ({ version: a.loader.version, stable: a.loader.stable }));
}


async function getLoaderVersionsFor(loader, mcVersion) {
  switch (loader) {
    case 'forge':
      return getForgeVersionsFor(mcVersion);
    case 'neoforge':
      return (await getNeoForgeVersionsFor(mcVersion)).map(version => ({ version, type: 'release' }));
    case 'fabric':
      return getFabricLoaderVersionsFor(mcVersion);
    case 'vanilla':
    default:
      return [];
  }
}

module.exports = {
  getVanillaVersions,
  getForgeVersionsFor,
  getNeoForgeVersionsFor,
  getFabricSupportedGameVersions,
  getFabricLoaderVersionsFor,
  getLoaderVersionsFor,
};
