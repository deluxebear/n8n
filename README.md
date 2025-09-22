forked from deluxebear/n8n

![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n - 技术团队的安全工作流自动化平台

**⚠️ 免责声明：本中文版仅供个人测试使用，如因使用本中文版本引起的任何法律问题，由使用者自行承担。**

n8n 是一个工作流自动化平台，为技术团队提供代码般的灵活性和无代码的速度。拥有400+集成、原生AI功能和公平代码许可证，n8n让您能够构建强大的自动化工作流，同时保持对数据和部署的完全控制。

![n8n.io - Screenshot](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png)

## 核心能力

- **按需编码**：编写JavaScript/Python代码，添加npm包，或使用可视化界面
- **AI原生平台**：基于LangChain构建AI代理工作流，使用您自己的数据和模型
- **完全控制**：使用公平代码许可证自托管或使用云服务
- **企业就绪**：高级权限管理、SSO和空隙部署
- **活跃社区**：400+集成和900+即用模板

## 快速开始


或使用 [Docker](https://docs.n8n.io/hosting/installation/docker/) 部署：

```
docker volume create n8n_data

# 使用中文版，启用企业版 环境变量设置：
# N8N_DEFAULT_LOCALE=zh-CN
# N8N_ENTERPRISE_MOCK=true
# NODE_ENV=development

docker run -it --rm --name n8n -p 5678:5678  -v n8n_data:/home/node/.n8n ghcr.io/deluxebear/n8n:chs

```

在浏览器中访问 http://localhost:5678 打开编辑器

## 资源

- 📚 [官方文档](https://docs.n8n.io)
- 🔧 [400+集成](https://n8n.io/integrations)
- 💡 [示例工作流](https://n8n.io/workflows)
- 🤖 [AI & LangChain指南](https://docs.n8n.io/langchain/)
- 👥 [社区论坛](https://community.n8n.io)

## 开发调试（node 环境必须 22.16 版本以上）

### 环境要求
- **Node.js**: 22.16 版本以上（推荐使用 22.x LTS）
- **pnpm**: 10.2.1 版本以上（项目使用 pnpm 作为包管理器）
- **操作系统**: Windows/macOS/Linux 均可

### 开发调试步骤

#### 1. 安装依赖
```bash
pnpm install
```

#### 2. 运行开发调试
```bash
pnpm dev:e2e:server
```

这个命令会同时启动：
- **后端服务**: 运行在 `http://localhost:5678`（默认端口）
- **前端开发服务器**: 运行在 `http://localhost:8080`

#### 3. 访问应用
- **前端开发环境**: http://localhost:8080/ （支持 Vue DevTools 调试）
- **后端 API**: http://localhost:5678/ （REST API 端点）

### 其他开发命令

#### 仅启动后端
```bash
pnpm dev:be
```

#### 仅启动前端
```bash
pnpm dev:fe
```

#### 启动 AI 相关功能
```bash
pnpm dev:ai
```

#### 完整开发环境（包含所有服务）
```bash
pnpm dev
```

### 调试技巧

#### 前端调试
- 访问 `http://localhost:8080/` 可以使用 Vue DevTools 进行调试
- 前端使用 Vite 开发服务器，支持热重载
- 可以在浏览器开发者工具中查看网络请求和错误信息

#### 后端调试
- 后端运行在 `http://localhost:5678`
- 支持 TypeScript 热重载
- 可以通过环境变量配置数据库类型和其他设置

#### 环境变量配置
```bash
# 设置中文语言
N8N_DEFAULT_LOCALE=zh-CN

# 启用企业版功能（开发测试用）
N8N_ENTERPRISE_MOCK=true

# 设置开发环境
NODE_ENV=development


#### 数据库配置
开发环境默认使用 SQLite 数据库，如需使用其他数据库：
```bash
# PostgreSQL
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=your_user
DB_POSTGRESDB_PASSWORD=your_password

```

### 常见问题

#### 依赖安装失败
```bash
# 清理缓存后重新安装
pnpm store prune
pnpm install
```

#### 构建问题
```bash
# 清理构建缓存
pnpm clean

# 重新构建
pnpm build
```

