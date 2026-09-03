![横幅图片](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n —— AI 智能体与工作流自动化平台

n8n 是一个采用公平代码（fair-code）模式的平台，可用于构建和部署 AI 智能体与自动化工作流。你可以将可视化画布与自定义代码结合，在本地自行托管或使用 [n8n 云服务](https://app.n8n.cloud/login)，并连接 1500 多种集成。从原型验证到生产运行，n8n 能帮助你构建值得信赖、可处理实际业务的 AI 自动化流程。

![n8n 界面截图](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png)

## 核心能力

- **AI 原生自动化平台**：使用自己的数据、模型和工具构建并运行 AI 工作流与多步骤智能体
- **模型灵活，无供应商锁定**：连接 OpenAI、Anthropic、Google 或开源模型，无需改变整体架构即可切换提供商
- **从原型到生产**：设计包含逻辑判断、工具调用、人工审批和完整可观测能力的多步骤 AI 工作流
- **按需使用代码**：将可视化编排与 JavaScript、Python 和 npm 包结合，处理复杂的 AI 自动化场景
- **满足企业级需求**：支持自行托管或安全部署，并提供基于角色的访问控制、审计记录和敏感数据保护能力
- **复用丰富生态**：通过 1500 多种集成和 9000 多个工作流[模板](https://n8n.io/workflows)，将 AI 接入现有系统

## 快速开始

### 使用一键安装脚本

已安装 [Docker](https://www.docker.com/) 时，可直接运行：

```bash
curl -fsSL https://get.n8n.io | sh
```

也可以使用以下方式手动启动。

### 使用 npx

安装 [Node.js](https://nodejs.org/) 后，可以直接启动 n8n：

```bash
npx n8n
```

### 使用 Docker

```bash
docker volume create n8n_data
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

启动后访问 [http://localhost:5678](http://localhost:5678) 打开编辑器。

## 使用 Docker Compose 部署

仓库的 [`docker-compose`](docker-compose) 目录提供了一套包含以下组件的部署配置：

- `n8n`：Web UI 与 API 主服务
- `task-runners`：外部任务执行器
- `caddy`：反向代理与自动 HTTPS

部署前请确保：

- 已安装 Docker，且 `docker compose` 命令可用
- 服务器已开放 `80` 和 `443` 端口
- 域名的 A 或 AAAA 记录已指向部署服务器

### 1. 配置域名

编辑 [`docker-compose/Caddyfile`](docker-compose/Caddyfile)，将示例域名替换为真实域名：

```caddy
n8n.example.com {
    reverse_proxy n8n-main:5678
}
```

然后编辑 [`docker-compose/docker-compose.yml`](docker-compose/docker-compose.yml)，确保以下配置使用相同域名：

```text
N8N_HOST=n8n.example.com
WEBHOOK_URL=https://n8n.example.com/
```

### 2. 配置任务执行器令牌

生成一个新的认证令牌：

```bash
openssl rand -hex 32
```

将生成的值同时写入 `n8n` 和 `task-runners` 服务的 `N8N_RUNNERS_AUTH_TOKEN`，两处必须完全一致。不要将真实令牌提交到仓库，建议通过 `.env` 文件或密钥管理系统注入。

用于生产环境时，还应将 `NODE_ENV` 设置为 `production`，并根据许可证和运行环境关闭 `N8N_ENTERPRISE_MOCK`。

### 3. 启动并验证服务

```bash
cd docker-compose
docker compose up -d
docker compose ps
```

按需查看日志：

```bash
docker compose logs -f n8n
docker compose logs -f task-runners
docker compose logs -f caddy
```

服务启动后访问 `https://你的域名`。建议创建并执行一个简单工作流，再运行包含代码或任务执行节点的工作流，以确认主服务、HTTPS 和 `task-runners` 均正常工作。

完整配置说明、数据持久化、更新方式和常见运维命令请参阅 [Docker Compose 部署说明](docker-compose/DEPLOYMENT.md)。

## 相关资源

- 📚 [官方文档](https://docs.n8n.io)
- 🔧 [1500 多种集成](https://n8n.io/integrations)
- 💡 [工作流示例](https://n8n.io/workflows)
- 🤖 [AI 与 LangChain 指南](https://docs.n8n.io/advanced-ai/)
- 👥 [社区论坛](https://community.n8n.io)
- 📖 [社区教程](https://community.n8n.io/c/tutorials/28)

## 获取支持

如需帮助或希望与其他用户交流，请访问 [n8n 社区论坛](https://community.n8n.io)。

## 许可证

n8n 采用[公平代码](https://faircode.io)模式，并根据[可持续使用许可证](https://github.com/n8n-io/n8n/blob/master/LICENSE.md)和 [n8n 企业许可证](https://github.com/n8n-io/n8n/blob/master/LICENSE_EE.md)发布。

- **源代码可见**：源代码始终公开可查
- **支持自行托管**：可以部署到自己的运行环境
- **易于扩展**：可以添加自定义节点和功能

如需额外功能和支持，可联系 [n8n 企业许可团队](mailto:license@n8n.io)。有关许可证模式的更多信息，请参阅[许可证文档](https://docs.n8n.io/sustainable-use-license/)。

## 参与贡献

发现缺陷 🐛 或有新功能建议 ✨？请查阅[贡献指南](https://github.com/n8n-io/n8n/blob/master/CONTRIBUTING.md)，了解开发环境配置与最佳实践。

## 加入团队

希望参与塑造自动化技术的未来？欢迎查看 [n8n 招聘职位](https://n8n.io/careers)并加入团队。

## n8n 这个名字是什么意思？

**简短回答：** n8n 是“nodemation”的缩写，读作“n-eight-n”。

**详细回答：** 创始人兼 CEO Jan Oberhauser 在为项目寻找一个拥有可用域名的名称时，发现想到的好名字几乎都已被占用，最终选择了“nodemation”。其中，“node”既代表节点视图，也代表 Node.js；“mation”则来自“automation”，即项目所要实现的自动化目标。但这个名字太长，不适合在命令行中频繁输入，因此最终缩写为“n8n”。
