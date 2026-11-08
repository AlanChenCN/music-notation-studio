# 局域网 HTTPS

当前为电脑上的局域网 HTTPS 预览，尚未部署到 iStoreOS。应用端口为 8120；8888 仅用于下载公开根证书，不提供应用或任意文件访问。

## 生成本地证书

需要 Node.js 24、依赖已安装，以及 OpenSSL；Windows 脚本也支持 Git for Windows 自带的 OpenSSL。

在仓库根目录执行，替换为电脑实际的局域网 IPv4 地址：

```powershell
./scripts/setup-https.ps1 -LanIp 192.168.31.186
```

脚本首次生成通用本地 CA（Local Development CA），随后签发服务器证书。服务器证书有效期 365 天，包含指定 IP、localhost、127.0.0.1 和 ::1。

证书和私钥全部在 Git 忽略的 `.cert/` 中。仅分发 `local-ca.cer`，不分享私钥或整个目录。电脑 IP 变化或服务器证书到期时重新运行脚本并重启服务；脚本保留已有 CA，无需重复安装同一个根证书。

## 启动

```bash
npm run dev
```

存在 `.cert/server-key.pem` 和 `.cert/server.pem` 时，Vite 自动使用 HTTPS；没有证书时仍以 HTTP 启动。开发和构建预览均固定监听 `0.0.0.0:8120`，端口被占用时直接报错。

本次配置的地址：<https://192.168.31.186:8120/>。本机也可使用 <https://localhost:8120/>。浏览器在信任本地 CA 前会提示证书不受信任；程序不会自动修改 Windows 或移动设备的信任存储。

## iPad／iPhone 安装与信任

在电脑另开终端启动仅分发公开根证书的服务：

```bash
npm run certificate
```

1. 设备连接同一局域网，在 Safari 打开 <http://192.168.31.186:8888/> ，点击“下载根证书”并允许下载描述文件。
2. 在“设置 → 通用 → VPN 与设备管理”中找到下载的证书描述文件并安装。
3. 在“设置 → 通用 → 关于本机 → 证书信任设置”中，启用 **Local Development CA** 的完全信任。
4. 返回 Safari，打开 <https://192.168.31.186:8120/>，确认没有证书警告，再启用 Beacio 对该网站的权限并连接电钢琴。

### 主屏幕入口与 Beacio

添加到主屏幕时，如出现“作为网页 App 打开”（Open as Web App），请关闭该选项，让入口在 Safari 中打开。Safari 26 起即使清单配置为 `display: browser`，添加时仍可能默认选择网页 App 模式，网页配置不能代替用户关闭此开关。已有独立网页 App 入口需删除后重新添加。

Beacio 依赖 Safari 扩展提供蓝牙接口；用户已反馈从独立主屏幕网页打开时不能使用 Beacio。当前以 Safari 标签页为连接与验收环境，主屏幕图标仅作为浏览器书签入口。保留图标不要求开启独立网页 App 模式。

参考：[WebKit Safari 26 主屏幕行为说明](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)、[Beacio 文档](https://beacio.com/docs)。设备系统版本与关闭开关后的连接结果仍待实机记录。

手动安装证书后还需单独启用 SSL 完全信任，详见 [Apple 官方说明](https://support.apple.com/en-us/102390)。如需停用，删除相应证书描述文件。证书安装、信任及真实蓝牙连接需要在设备上完成。

证书分发服务只读取公开的 `.cer` 文件。完成安装后可关闭 8888 的终端；应用 HTTPS 服务不依赖该服务。开发服务还会阻止直接访问 `.cert/` 文件。

## 本机验证与浏览器测试

```powershell
curl.exe --noproxy "*" --cacert .cert/local-ca.pem -I https://192.168.31.186:8120/
```

应返回 HTTP 200，且不需要 `-k` 跳过证书验证。

Playwright 自动化使用独立的 5174 回环 HTTP 服务，并设置 `MNS_HTTP_ONLY=1`，不依赖开发者是否生成了本地证书。它不能替代设备上的 HTTPS 信任与硬件验收。

## iStoreOS 后续部署

当前机器证书仅覆盖上述地址，不可直接用于另一个 NAS IP。后续需确定 iStoreOS 托管方式与地址，构建 `dist/` 并为实际地址配置证书或 HTTPS 反向代理；不把开发服务器视为正式 NAS 部署。

8888 首页提供下载按钮，实际公开下载路径为 /local-ca.cer；URL 路径是服务路由，不需要对应磁盘目录。.cert/ 为本机存储目录，不对外开放。其他项目可使用同一 CA 签发覆盖各自地址的服务器证书，端口无需写入证书。

需更换根证书名称或密钥时，运行 powershell -ExecutionPolicy Bypass -File scripts/setup-https.ps1 -LanIp 192.168.31.186 -NewAuthority。该操作先备份现有证书到 .cert/archive/，然后重新生成 CA 与服务器证书；需重启两个服务并在设备上重新安装和信任根证书。日常续签不加 -NewAuthority。
