帮我生成一份需求分析+实现文档：react+ts+opentui. 
场景：某个项目 添加一个bug或者新的feature实现 当时可能不想修 就放在本地存着 这时候就需要issue-make 
比如`issue-make` 进入tui 然后输入 `/add:${type}` slash命令 输出feature或者issue 就能自动在当前项目下面创建 .issues/stash/{this-is-title}.{number}.md  
也可以通过 `issue-make init` 配置全局openai-sdk 比如Deepseek：配置 url + api + model 能够得到标题总结。
全局配置放在 ~/.issue-make/settings.json里面
或者通过 `issue-make add --type feat path/to/description.md` 去cli添加 issue
issue文件内容如下
```markdown
---
Create Date: YYYY-DD-MM
Type: [feat|todo|bug|refact] # 
---
${添加上的原文}
```

`issue-make open [title|number]` 这个命令会从stash/中 找到对应的文件到 doing/
找到当前项目的 `AGENTS.md` 文件(没有就创建) append有如下描述进去 其实就是把刚刚open的文件路径给进去
```
<<!-- ISSUE-MAKE:START -->>
本项目使用issue-make工具追踪和管理issue.
现在issue-make给你委派了任务.
你的任务描述文件: `.issues/stash/{this-is-title}.{number}.md` 你需要完成里面描述的任务.
完成后，编写`.issues/solution.md` 概述你的解决方案。
```
# solution
## 改动文件
## 解决办法
```
<<!-- ISSUE-MAKE:END -->>
```
在agent完成任务后 人进行 ：`issue-make close [title|number]` 删除掉 AGENTS.md里附加的内容 移动文件到`.issues/achieved/{this-is-title}.md` 移除number
然后把`.issues/solution.md` append进这个文件 然后删除solution.md


# 目录
- .issue/
    - slash/ #  存放临时添加的提案
    - achieved/ # close 归档完毕的提案

