# n8n Docker Compose 部署说明

本文档基于当前目录下的 `docker-compose.yml`、`docker-compose-sandbox.yml` 与 `Caddyfile`，用于部署普通版或支持 Sandbox 的 n8n 环境。

普通版包含以下组件：

- `n8n` 主服务（Web UI + API）
- `task-runners` 外部任务执行器
- `caddy` 反向代理（自动 HTTPS）

Sandbox 版在普通版基础上增加 `sandbox-api`、`sandbox-runner-1` 和按需创建的 Sandbox 执行容器。详细说明见第 8 节。

## 1. 前置条件

- 已安装 Docker 与 Docker Compose（`docker compose` 命令可用）
- 服务器已开放 `80` 与 `443` 端口
- 域名已在 DNS 服务商处绑定服务器公网 IP（A 记录/AAAA 记录）
- 域名已解析到部署服务器（示例：`n8n.example.com`）
- 建议先用 `dig` 或 `nslookup` 验证解析结果后再启动容器

## 2. 部署前配置（必须）

请先修改以下配置项，再启动服务。

### 2.1 修改 `Caddyfile`

文件：`Caddyfile`

将域名从示例值改为真实域名：

```caddy
n8n.example.com {
    reverse_proxy n8n-main:5678
}
```

### 2.2 修改 `docker-compose.yml`

文件：`docker-compose.yml`

重点检查并替换：

- `N8N_HOST=n8n.example.com`
  改成你的真实域名（与 `Caddyfile` 一致）
- `WEBHOOK_URL=https://n8n.example.com/`
  改成真实 Webhook 地址（建议与域名一致）
- `N8N_RUNNERS_AUTH_TOKEN=...`（`n8n` 与 `task-runners` 两处）
  两处必须完全一致，建议重新生成：

```bash
openssl rand -hex 32
```

### 2.3 环境定位说明（建议确认）

当前配置中包含：

- `NODE_ENV=development`
- `N8N_ENTERPRISE_MOCK=true`

如果用于生产环境，建议改为：

- `NODE_ENV=production`
- 关闭 mock 配置（按你的许可证/环境策略处理）

## 3. 启动服务

在当前目录执行：

```bash
docker compose up -d
```

查看状态：

```bash
docker compose ps
```

查看日志（按需）：

```bash
docker compose logs -f n8n
docker compose logs -f caddy
docker compose logs -f task-runners
```

## 4. 验证部署

- 浏览器访问：`https://你的域名`
- n8n 页面可正常打开并登录
- 创建一个简单工作流并手动执行
- 测试含代码/任务执行节点，确认 `task-runners` 正常工作

## 5. 常见运维命令

停止服务：

```bash
docker compose down
```

重启服务：

```bash
docker compose restart
```

更新镜像并重建：

```bash
docker compose pull
docker compose up -d
```

## 6. 数据与持久化

当前 compose 使用了以下命名卷：

- `n8n_data`：n8n 数据目录（`/home/node/.n8n`）
- `caddy_data`：Caddy 证书与状态数据
- `caddy_config`：Caddy 配置数据

删除容器不会清除命名卷；如需彻底清理，请谨慎执行：

```bash
docker compose down -v
```

## 7. 安全建议

- 不要在仓库中明文保存真实 `N8N_RUNNERS_AUTH_TOKEN`
- 建议通过 `.env` 文件或密钥管理系统注入敏感变量
- 首次上线后，检查是否能直接从公网访问不必要端口（仅保留 `80/443` 对外）

## 8. 部署支持 Sandbox 的版本

需要使用 n8n Instance AI Sandbox 服务时，请使用 `docker-compose-sandbox.yml`。
不要直接执行不带 `-f` 参数的 `docker compose up -d`，该命令只会启动不含 Sandbox 的默认部署文件。

Sandbox 版本新增以下服务：

- `sandbox-certs`：生成 API 与 Runner 之间通信所需的 mTLS 证书。
- `sandbox-api`：负责请求认证、Sandbox 状态管理以及选择可用的 Runner。
- `sandbox-runner-1`：运行 Docker-in-Docker，并根据请求创建或删除实际的 Sandbox 容器。
- 实际执行环境使用 `ghcr.io/n8n-io/n8n-sandbox-service-sandbox:latest` 镜像。

服务调用链如下：

```text
n8n → sandbox-api → sandbox-runner-1 → 按需创建的 Sandbox 容器
```

### 8.1 创建 Sandbox 环境变量文件

进入 `docker-compose` 目录，然后复制环境变量模板：

```bash
cp .env.sandbox.example .env
openssl rand -hex 32
```

执行四次 `openssl rand -hex 32`，为下面四个变量分别生成不同的随机值，并填写到 `.env`：

```dotenv
N8N_RUNNERS_AUTH_TOKEN=
N8N_SANDBOX_SERVICE_API_KEY=
SANDBOX_API_RUNNER_REGISTRATION_TOKEN=
SANDBOX_API_RUNNER_API_KEY=
```

请妥善保管 `.env`，不要将其提交到 Git。Compose 文件会将同一个密钥分别传入通信双方，确保 n8n、Sandbox API 与 Sandbox Runner 能够相互认证。

四个变量的用途如下：

- `N8N_RUNNERS_AUTH_TOKEN`：认证 n8n 与普通 `task-runners`。
- `N8N_SANDBOX_SERVICE_API_KEY`：认证 n8n 向 `sandbox-api` 发出的请求。
- `SANDBOX_API_RUNNER_REGISTRATION_TOKEN`：认证 Sandbox Runner 向 API 发起的注册请求。
- `SANDBOX_API_RUNNER_API_KEY`：认证 API 与 Sandbox Runner 之间的请求。

### 8.2 拉取镜像并启动服务

在 `docker-compose` 目录执行：

```bash
docker compose --env-file .env -f docker-compose-sandbox.yml pull
docker compose --env-file .env -f docker-compose-sandbox.yml up -d
docker compose --env-file .env -f docker-compose-sandbox.yml ps
```

第一次使用 Sandbox 时可能需要等待更长时间，因为 DinD Runner 需要在其内部 Docker 环境中拉取实际的 Sandbox 镜像。

### 8.3 验证 Sandbox 服务

先检查服务状态：

```bash
docker compose --env-file .env -f docker-compose-sandbox.yml ps
```

`sandbox-api` 应显示为健康状态。`sandbox-certs` 在证书生成成功后正常退出，其状态可能显示为 `Exited (0)`。

如需进一步确认，查看各服务日志：

```bash
docker compose --env-file .env -f docker-compose-sandbox.yml logs sandbox-certs
docker compose --env-file .env -f docker-compose-sandbox.yml logs sandbox-api
docker compose --env-file .env -f docker-compose-sandbox.yml logs sandbox-runner-1
```

日志中应能确认以下状态：

- `sandbox-certs` 已成功生成 mTLS 证书。
- `sandbox-api` 已正常监听并通过健康检查。
- `sandbox-runner-1` 已启动内部 Docker daemon，并成功注册到 API。

Runner 启动后不会立即创建实际的 Sandbox 容器。只有 n8n 发起 Sandbox 请求时，Runner 才会按需创建容器。

第一次触发 Sandbox 请求后，可以检查 Runner 内部创建的容器：

```bash
docker compose --env-file .env -f docker-compose-sandbox.yml exec sandbox-runner-1 docker ps -a
```

### 8.4 在 n8n 中使用 Sandbox

Sandbox 版 Compose 已启用 `n8n-sandbox` Provider。n8n 通过 Compose 内部网络访问 `sandbox-api:8080`，Sandbox API 和 Runner 的端口不会暴露到宿主机或公网。

当 Instance AI 功能申请执行环境时，处理流程如下：

1. n8n 使用 API Key 向 `sandbox-api` 申请 Sandbox。
2. `sandbox-api` 选择可用的 Runner。
3. Runner 使用指定的 Sandbox 镜像创建隔离容器。
4. Sandbox 容器内的 daemon 执行命令和文件操作。
5. 执行结果依次通过 Runner 和 API 返回给 n8n。

普通 Code 节点仍由已有的 `task-runners` 服务处理。Sandbox 服务主要用于需要独立工作区和隔离执行环境的 Instance AI 功能。

### 8.5 常用运维命令

重启 Sandbox API 和 Runner：

```bash
docker compose --env-file .env -f docker-compose-sandbox.yml restart sandbox-api sandbox-runner-1
```

更新镜像并重新创建服务：

```bash
docker compose --env-file .env -f docker-compose-sandbox.yml pull
docker compose --env-file .env -f docker-compose-sandbox.yml up -d
```

停止 Sandbox 版完整服务栈：

```bash
docker compose --env-file .env -f docker-compose-sandbox.yml down
```

该命令会保留命名卷中的数据。除非确定要删除 n8n 数据、Caddy 数据和 Sandbox 证书，否则不要添加 `-v` 参数。

### 8.6 安全注意事项

- `sandbox-runner-1` 使用 `privileged: true`，因为它需要运行内部 Docker daemon。只应在可信主机上部署该服务。
- 不要将 Sandbox 服务的 `8080`、`9090` 或 `9091` 端口暴露到公网。
- `.env` 中的四个密钥必须使用不同的随机值，并定期轮换。
- 当前 Sandbox API、Runner 和实际 Sandbox 镜像使用浮动的 `latest` 标签。生产环境建议将三个镜像固定到相互兼容的明确版本。
- 请确保只有 Caddy 的 `80` 和 `443` 端口可以从公网访问。

### 8.7 常见问题排查

如果 `sandbox-certs` 失败，请检查证书卷并查看日志：

```bash
docker compose --env-file .env -f docker-compose-sandbox.yml logs sandbox-certs
```

如果 `sandbox-api` 无法进入健康状态，请确认 `.env` 中的三个 Sandbox 密钥均已填写，并检查 API 日志。

如果 Runner 无法注册，请重点检查以下事项：

- API 与 Runner 使用的注册密钥是否一致。
- `sandbox-certs` 是否成功生成证书。
- Runner 是否能通过内部网络访问 `sandbox-api:9090`。
- 宿主机是否允许启动特权容器。

如果创建 Sandbox 时长时间停留在等待状态，请检查 Runner 内部 Docker：

```bash
docker compose --env-file .env -f docker-compose-sandbox.yml exec sandbox-runner-1 docker info
docker compose --env-file .env -f docker-compose-sandbox.yml exec sandbox-runner-1 docker images
```

如果无法拉取 Sandbox 镜像，请检查服务器到 `ghcr.io` 的网络和 DNS 连接。
