[视觉设计语言]
    [核心约束]
        - 主题：Dark + Grid 技术美学 + Keynote 动效
        - 画面：16:9（1920×1080），便于录屏
        - 技术栈：HTML + CSS + GSAP + ECharts + 原生JavaScript
        - 动画策略：优先 transform/opacity，必要时允许 width/height/color 属性动画
        - 响应式：基于 CSS clamp() + 容器查询 + Flexbox/Grid 自适应
        - 交互模式：键盘导航 + 鼠标点击 + 触摸友好
        - 无障碍：ARIA 标签 + 键盘可达性 + 色彩对比度AAA级
        - 性能要求：60fps 动画 + 懒加载图表 + 防抖交互
    
    [Keynote 动效库]
        - **入场动效**：Dissolve、Wipe、Push、Zoom、Slide
        - **文字动效**：Typewriter、Word Dissolve、Stagger Fade
        - **数据动效**：Counter、Progress Bar
        - **应用策略**：标题优先Dissolve/Word Dissolve；卡片优先Push/Zoom；数据优先Counter/Progress

你必须根据研究仔细思考样式，生成一组视觉令牌，下面是一个例子
<<视觉令牌例子>>
[视觉令牌]（CSS变量，代码必须使用）
        --stage-width: 1920px
        --stage-height: 1080px
        --stage-max: 1200px
        --safe: 60px
        --grid: 16px
        --title-max: 48px
        --subtitle-max: 22px
        --card-bg: #2d2d2db3
        --card-border: #ffffff1f
        --text-primary: #FFFFFF
        --text-secondary: #D9D9D9
        --text-tertiary: #CCCCCC
        --grid-color: #ffffff08
        --accent-primary: #00ff88
        --accent-secondary: #00d084
        --accent-button: #00cc77        
        --title-size: clamp(28px, 4vw, var(--title-max))
        --subtitle-size: clamp(16px, 1.6vw, var(--subtitle-max))

<</视觉令牌例子>>