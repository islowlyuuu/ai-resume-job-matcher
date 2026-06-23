# AI Boss 投递助手

一个面向国内 Boss 直聘求职场景的 AI 全栈项目。用户可以粘贴或上传简历，再粘贴 Boss 岗位描述，系统会自动分析岗位要求、优化简历表达、生成自然的第一句沟通话术，并保存分析历史。

项目目标不是写一封很正式的求职信，而是帮助求职者在 Boss 投递时更快完成三件事：看懂岗位、改好简历、发出不尴尬的开场白。

## 功能

- 支持粘贴简历文本
- 支持上传 PDF、Word（DOCX）简历文件
- 支持粘贴 Boss 岗位 JD
- 自动生成岗位匹配分数、匹配优势、能力差距和优化建议
- 根据岗位要求生成优化后的简历标题和个人摘要
- 自动改写工作经历 / 项目经历 bullet
- 提取适合放入简历的 ATS 关键词
- 生成 3 条自然、简短、低 AI 味的 Boss 开场白
- 保存和清空本地分析历史
- 未配置 OpenAI API Key 时，使用本地关键词分析器，方便直接演示
- 配置 `OPENAI_API_KEY` 后，自动切换到 OpenAI 模型分析

## Boss 开场白风格

项目会避免生成下面这种正式求职信：

```txt
尊敬的招聘团队：
您好！我希望申请贵公司的岗位……
```

更适合 Boss 的输出是：

```txt
您好，我有 React 和后台系统开发经验，感觉和岗位要求比较匹配，想沟通下这个机会。
```

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
  | Next.js 求职工作台
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
    "resume_text": "张明\n前端开发，熟悉 React、TypeScript、后台系统和数据看板开发。",
    "job_description": "Boss 岗位：前端开发工程师\n要求熟悉 React、TypeScript，有后台系统和数据可视化经验。"
  }'
```

## 测试

```bash
cd backend
pytest
```

## 简历项目描述参考

```txt
AI Boss 投递助手：面向国内 Boss 直聘求职场景的 AI 全栈应用，支持岗位 JD 解析、简历定向优化、自然开场白生成和投递分析历史管理。
```

```txt
- 使用 Next.js、TypeScript 和 Tailwind CSS 构建响应式求职工作台，支持简历输入、岗位 JD 分析和优化结果展示。
- 基于 FastAPI、SQLModel 和 SQLite 实现简历分析记录、文件解析和历史管理接口。
- 设计低 AI 感 Prompt，生成 30-60 字 Boss 开场白，避免正式求职信和模板化表达。
- 根据岗位要求提取技能关键词、匹配差距和简历优化方向，生成可直接用于简历修改的摘要和经历 bullet。
```

## 后续规划

- 增加投递记录管理：公司、岗位、链接、状态、备注
- 增加面试准备：根据 JD 生成面试题和回答思路
- 增加可编辑简历模板，一键导出 Word / PDF 简历
- 增加数据看板，统计投递数量、沟通率、面试率

## License

MIT
