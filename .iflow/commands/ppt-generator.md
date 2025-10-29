# ppt-generator Command

When this command is used, entering the following workflow:

<!-- Powered by IFLOW™ Core -->

# ppt-generator

ACTIVATION-NOTICE: This file contains your full agent operating guidelines. DO NOT load any external agent files as the complete configuration is in the YAML block below.

CRITICAL: Read the full YAML BLOCK that FOLLOWS IN THIS FILE to understand your operating params, start and follow exactly your activation-instructions to alter your state of being, stay in this being until told to exit this mode:

## COMPLETE and EXECUTE workflow DEFINITION FOLLOWS

```yaml
workflow:
  id: generate-ppt
  name: Generate PPT for user
  description: >-
    这个工作流描述了把用户的脚本（script）与风格意图转换为演示文稿的分镜与动效；制定技术方案（仅 HTML + CSS + GSAP），最后生成可运行的演示文稿（Web 代码，浏览器预览）。
  type: greenfield

  sequence:
    - agent: coordinator
      creates: requirement-brief.md
      notes: "Make suer you fully understand user's requirement before go to next step. SAVE OUTPUT: Copy final requirement-brief.md to your project's docs/ folder. Toggle Yolo Mode when requirement-brief.md is generated, which means no human in the loop for the following sequences in the workflow before it's completed."

    - agent: analyst
      creates: research.md
      requires: requirement-brief.md
      optional_steps:
        - summarize_users_docs
      notes: "Creates RESEARCH doc from requirement brief. SAVE OUTPUT: Copy final research.md to your project's docs/ folder."

    - agent: ux-expert
      creates: ux-spec.md and ppt-template.html
      requires: research.md
      notes: "Creates UI/UX specification using ux-spec-tmpl. SAVE OUTPUT: Copy final ux-spec.md and ppt-template.html to your project's docs/ folder."

    - agent: ppt-designer
      creates: slides.md
      requires: research.md
      notes: "Creates slides of PPT using ppt-slides-tmpl. SAVE OUTPUT: Copy final slides.md to your project's docs/ folder."

    - agent: developer
      creates: {ppt_name}.html
      requires: ux-spec.md, ppt-template.html and slides.md
      notes: "Only when ux-expert and ppt-designer complete their jobs then start develop. Generate ppt file by coding, give a meaningful name to file. "

    - workflow_end:
      action: project_complete
      notes: |
        All slides of ppt implemented and reviewed!

  flow_diagram: |
    ```mermaid
    graph TD
        A[Start: generate-ppt] --> B[coordinator: requirement-brief.md]
        B --> C[analyst: research.md]
        C --> D[ux-expert: ux-spec.md and ppt-template.html]
        C --> E[ppt-designer: slides.md]
        D --> F[ddeveloperev: ppt.html]
        E --> F[developer: ppt.html]
        F --> G[Project Complete]
    ```

  decision_guidance:
    when_to_use:
      - Building a ppt file
      - Multiple views/pages with complex ppt

  handoff_prompts:
    coordinator_to_analyst: "Requirement is clarified. Save it as docs/requirement-brief.md in your project, then create the RESEARCH doc."
    analyst_to_ux: "RESEARCH is completed. Save it as docs/research.md in your project, then create the UI/UX specification and ppt-template."
    analyst_to_ppt-designer: "RESEARCH is completed. Save it as docs/research.md in your project, 进行大纲设计及分镜设计"
    ux_to_dev: "Make sure BOTH of UI/UX specification and 大纲设计及分镜设计 are completed, then move on development."
    ppt-designer_to_dev: "Make sure BOTH of UI/UX specification and 大纲设计及分镜设计 are completed, then move on development."
    complete: "All PPT development artifacts are generated and saved."
```
