const path = require('path');

function resolveUndici() {
  try {
    const ftPkgPath = require.resolve('@xmcl/file-transfer/package.json');
    const undiciPath = require.resolve('undici', { paths: [path.dirname(ftPkgPath)] });
    return require(undiciPath);
  } catch (e) {
    // Không tìm được ngữ cảnh của @xmcl/file-transfer (không nên xảy ra vì
    // nó luôn được cài kèm @xmcl/installer) — fallback về resolve thông
    // thường để launcher vẫn chạy được thay vì crash cứng ở đây.
    return require('undici');
  }
}

const { Agent, ProxyAgent, interceptors } = resolveUndici();
const { loadConfig } = require('./config');

const ASSET_HOST_MIRRORS = [
  'https://resources.download.minecraft.net',
  'https://bmclapi2.bangbang93.com/assets',
];

const MAVEN_HOST_MIRRORS = [
  'https://libraries.minecraft.net',
  'https://bmclapi2.bangbang93.com/maven',
];

const VERSION_MANIFEST_MIRRORS = [
  undefined, // undefined = dùng remote mặc định (piston-meta.mojang.com) của @xmcl/installer
  'https://bmclapi2.bangbang93.com/mc/game/version_manifest.json',
];

function withRedirectSupport(baseDispatcher) {
  return baseDispatcher.compose(interceptors.redirect({ maxRedirections: 5 }));
}

let cachedDispatcher = null;
let cachedDispatcherKey = null;

function buildDispatcher(proxyUrl) {
  const key = proxyUrl || '__direct__';
  if (cachedDispatcher && cachedDispatcherKey === key) return cachedDispatcher;

  const base = proxyUrl
    ? new ProxyAgent({
        uri: proxyUrl,
        connect: { timeout: 30_000 },
      })
    : new Agent({
        connect: { timeout: 30_000 },
        keepAliveTimeout: 30_000,
        connections: 16,
      });

  cachedDispatcher = withRedirectSupport(base);
  cachedDispatcherKey = key;
  return cachedDispatcher;
}

function getNetworkOptions() {
  const config = loadConfig();
  const net = config.network || {};
  const useMirror = net.useMirror !== false; // mặc định BẬT
  const proxy = (net.proxy || '').trim() || null;

  const options = {
    dispatcher: buildDispatcher(proxy),
  };

  if (useMirror) {
    options.assetsHost = ASSET_HOST_MIRRORS;
    options.mavenHost = MAVEN_HOST_MIRRORS;
  }

  options.assetsDownloadConcurrency = 8;
  options.librariesDownloadConcurrency = 8;

  return options;
}

async function fetchVersionListWithFallback(getVersionList) {
  const net = loadConfig().network || {};
  const useMirror = net.useMirror !== false;
  const sources = useMirror ? VERSION_MANIFEST_MIRRORS : [undefined];

  const netOptions = getNetworkOptions();
  let lastError;
  for (const remote of sources) {
    try {
      return await getVersionList(remote ? { ...netOptions, remote } : netOptions);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Không thể tải danh sách phiên bản Minecraft từ bất kỳ nguồn nào.');
}

async function checkMirrorHealth() {
  const proxy = (loadConfig().network?.proxy || '').trim() || null;
  const dispatcher = buildDispatcher(proxy);

  const targets = [
    { label: 'Mojang - Assets', url: 'https://resources.download.minecraft.net' },
    { label: 'Mojang - Libraries', url: 'https://libraries.minecraft.net' },
    { label: 'Mojang - Version Manifest', url: 'https://piston-meta.mojang.com/mc/game/version_manifest.json' },
    { label: 'BMCLAPI - Assets', url: 'https://bmclapi2.bangbang93.com/assets' },
    { label: 'BMCLAPI - Maven', url: 'https://bmclapi2.bangbang93.com/maven' },
    { label: 'BMCLAPI - Version Manifest', url: 'https://bmclapi2.bangbang93.com/mc/game/version_manifest.json' },
  ];

  const { request } = resolveUndici();

  return Promise.all(targets.map(async (t) => {
    const started = Date.now();
    try {
      const res = await request(t.url, {
        method: 'HEAD',
        dispatcher,
        headersTimeout: 5_000,
        bodyTimeout: 5_000,
      });
      res.body.destroy();
      return { ...t, ok: res.statusCode < 500, statusCode: res.statusCode, ms: Date.now() - started };
    } catch (e) {
      return { ...t, ok: false, error: e.message, ms: Date.now() - started };
    }
  }));
}

module.exports = {
  getNetworkOptions,
  fetchVersionListWithFallback,
  checkMirrorHealth,
  ASSET_HOST_MIRRORS,
  MAVEN_HOST_MIRRORS,
};
