# AI 简历岗位匹配助手

一个 AI 全栈项目：用户可以粘贴或上传简历，再输入目标岗位描述，系统会自动分析简历与岗位的匹配度，并根据岗位要求生成一版更贴合目标岗位的简历优化方案。

这个项目适合用于 GitHub 展示，包含可用的前端界面、FastAPI 后端、数据库持久化、文件解析、可选 OpenAI 接入、Docker 配置、测试和完整启动说明。

## 功能

- 支持粘贴简历文本
- 支持上传 PDF、DOCX、TXT 简历文件
- 支持输入任意岗位描述
- 自动生成岗位匹配分数、总结、匹配优势、能力差距和优化建议
- 根据岗位要求生成优化后的简历标题和个人摘要
- 自动改写工作经历 / 项目经历 bullet
- 提取适合放入简历的 ATS 关键词
- 解释每处改写为什么更贴合目标岗位
- 自动生成中文求职信草稿
- 默认使用 SQLite 保存历史分析记录
- 未配置 OpenAI API Key 时，使用本地关键词分析器，方便直接演示
- 配置 `OPENAI_API_KEY` 后，自动切换到 OpenAI 模型分析
- 提供 Docker Compose 本地一键启动方案

## 技术栈

- 前端：Next.js、React、TypeScript、Tailwind CSS、lucide-react
- 后端：FastAPI、SQLModel、Pydantic、SQLite
- AI：OpenAI API + 本地 fallback 分析器
- 文件解析：pypdf、python-docx
- 工程化：Docker、Docker Compose
- 测试：pytest

## 架构

```txt
浏览器
  |
  | Next.js 界面
  v
Frontend :3000
  |
  | REST API
  v
FastAPI Backend :8000
  |
  | SQLModel
  v
SQLite 数据库
  |
  | 可选
  v
OpenAI API
```

## 项目结构

```txt
ai-resume-job-matcher/
  backend/
    app/
      api/          # API 路由
      core/         # 配置和数据库
      models/       # 数据表模型
      prompts/      # AI Prompt
      schemas/      # 请求和响应结构
      services/     # 业务逻辑
    tests/
  frontend/
    app/
    components/
    lib/
  docker-compose.yml
```

## 本地启动

### 1. 启动后端

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端地址：

```txt
http://localhost:8000
```

API 文档：

```txt
http://localhost:8000/docs
```

### 2. 启动前端

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

前端地址：

```txt
http://localhost:3000
```

## Docker 启动

先创建环境变量文件：

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

## OpenAI 配置

项目不配置 OpenAI 也可以运行。要启用模型分析，在 `backend/.env` 中设置：

```env
OPENAI_API_KEY="your_api_key"
OPENAI_MODEL="gpt-4o-mini"
```

未设置 API Key 时，后端会使用确定性的本地关键词分析器，方便面试官或 GitHub 访问者快速体验项目。

## API 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 后端健康检查 |
| GET | `/api/analyses` | 获取最近分析记录 |
| POST | `/api/analyses/text` | 分析并优化粘贴的简历文本 |
| POST | `/api/analyses/upload` | 分析并优化上传的简历文件 |
| DELETE | `/api/analyses` | 清空本地分析历史 |

请求示例：

```bash
curl -X POST http://localhost:8000/api/analyses/text \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "张明\n全栈工程师，熟悉 React、FastAPI、PostgreSQL 和数据看板开发。",
    "job_description": "高级全栈工程师，需要 React、FastAPI、PostgreSQL、AI 产品和数据看板经验。"
  }'
```

## 测试

```bash
cd backend
pytest
```

## 后续规划

- 增加登录系统和按用户隔离的分析历史
- 增加 PostgreSQL 生产环境配置
- 增加更细的评分维度，例如技能、经验年限、行业匹配、项目影响力
- 增加分析结果 PDF 导出
- 增加可编辑简历模板，一键导出优化后的 Word / PDF 简历
- 增加 RAG，用历史简历和岗位记录做个性化建议
- 增加 CI，自动运行后端测试和前端构建

## License

MIT
