- 严格遵守[视觉设计语言]和下面的[设计要求]来设计每一幕的画面以及元素
- 实现16:9画面边界（1920×1080），便于录屏定位
- 采用网格纹理背景，营造专业技术感
- 按分镜内容实现 Keynote 动效
- 单文件输出：完整HTML代码，包含内嵌CSS、GSAP和JavaScript
- 手动翻页控制，删除自动播放
- 集成PDF下载功能，横向16:9格式，每幕一页，移除所有动效，确保布局完整性

[设计要求]
- 生成代码时，严格遵守下面的设计要求
    （[基础舞台], "<16:9舞台容器：width:var(--stage-max); height:calc(var(--stage-max)*9/16); position:relative; margin:80px auto; padding:0; background: #000000; border:2px solid #444444; border-radius:16px; 深灰色边框便于录屏定位；舞台内所有内容必须在padding:var(--safe)的安全区域内>"）
    （[配色方案], "<整体采用深色主题，背景为纯黑色【#000000】，舞台边框使用【#444444】，卡片使用半透明深色背景【#2d2d2db3】，卡片边框使用【#ffffff1f】，网格线使用【#ffffff08】；文字层级：主要文字【#FFFFFF】、次要文字【#D9D9D9】、三级文字【#CCCCCC】；强调色系统：主强调色使用【科技绿 #00ff88】用于数据高亮、图表主色、关键数值展示，辅助强调色使用【柔和绿 #00d084】用于次要元素和成功状态，按钮色使用【深绿 #00cc77】确保足够对比度；图表配色使用绿色系【#00ff88, #00d084, #00cc77, #66ffaa】为主，辅助色可选择【紫色 #9333ea】、【蓝色 #3b82f6】用于对比和分类；所有配色需确保在纯黑背景上清晰可读且符合无障碍标准>"）              
    （[总体高度控制], "<场景总高度强制约束：定义CSS变量--available-height:calc(var(--stage-max) * 9 / 16 - 2 * var(--safe))；标题区域（含标题+副标题+margin-bottom）总高度≤calc(var(--available-height) * 0.25)；内容区域height≤calc(var(--available-height) * 0.75)；使用height而非max-height强制限制；当内容过多时优先缩小字体、减少间距>"）    
    （[动态空间分配], "<精确高度分配：scene-header使用height:calc(var(--available-height) * 0.25)包含所有内容和间距；content-area使用height:calc(var(--available-height) * 0.75)；布局样式：.split-layout使用display:flex，.card设置flex:1实现50%分布；.grid-2-layout使用display:grid，grid-template-columns:1fr 1fr实现50%分布；.grid-3-layout使用display:grid，grid-template-columns:1fr 1fr 1fr实现33.3%分布；.flow-container使用width:100% height:100%，内部flow元素按节点数量动态分配水平空间，每个节点最小宽度160px，节点间距20px；卡片内容区使用flex布局：卡片标题固定高度，内容区flex:1；强制overflow:hidden在卡片内容区；图表容器height:calc(var(--available-height) * 0.6)且max-height:400px>"）
    （[卡片内部安全距离], "<所有卡片内容必须保持内部安全距离：卡片padding:24px确保内容与边框间距；图表容器额外留出底部空间：margin-bottom:16px用于说明文字；文字内容使用line-height:1.4-1.6确保行间距；卡片底部预留20px空间避免内容截断；长文本使用text-overflow:ellipsis或line-clamp控制；确保所有可视内容在卡片内部安全区域内>"）
    （[防溢出机制], "<多层溢出保护：1)父容器强制height限制 2)子元素line-clamp:3限制文字行数 3)图表响应式缩放 4)卡片内容优先级排序（重要信息优先显示）5)字体大小自适应：font-size:clamp(12px, 2vw, 16px) 6)间距统一：gap:20px>"）
    （[内容自适应], "<布局适配规则：Grid布局使用grid-auto-rows:minmax(min-content, 1fr)；卡片内容优先显示核心信息，超长文本用ellipsis截断；图表优先保证可读性，必要时缩小legend或调整布局方向>"）    
    （[交互控制], "<翻页器必须在舞台外：创建独立的翻页容器，position:fixed; right:50%; bottom:20px; transform:translateX(calc(var(--stage-max)/2 + 20px)); z-index:9999; 确保不被舞台遮挡且在16:9录屏区域外>"）    
    （[响应式布局], "<智能布局切换：当垂直空间不足时，Grid-3自动降级为Grid-2；Grid-2降级为Split；Split降级为单列；图表说明优先水平布局（左图右文）；文字内容使用line-clamp限制行数>"）    
    （[ECharts数据可视化], "<图表高度动态计算：chartHeight=Math.min(350px, 内容区可用高度*0.7); 图表容器设置max-height和overflow:hidden; 图表配置responsive:true自适应容器; legend位置根据空间自动调整top/bottom/right>"）
    （[视觉平衡], "<整体页面追求视觉平衡和韵律感，通过内容组织创造节奏变化，重要信息区域给予更多视觉重量。即使是固定宽度布局，也要通过内部设计确保视觉趣味性>"）
    （[标签系统], "<在卡片底部添加标签栏，使用主色调小胶囊设计，提炼内容关键词或分类，每个卡片根据内容特点添加2-4个相关标签，标签文字简洁>"）
    （[图表讲解], "<所有数据图表卡片必须包含适合的图表讲解内容，解释数据含义、变化趋势和影响因素，讲解文字应位于图表下方或侧边，保持适当留白>"） 
    （[内容组织], "<每个卡片应包含合理的内容组合：醒目标题、核心数据可视化、简洁讲解文字、底部标签。不同类型卡片可有变化，但保持一致的视觉语言>"）
    （[网格对齐], "<所有卡片必须严格遵循网格对齐，水平方向不允许卡片漂浮，垂直方向保持适当间距。相邻卡片间距统一，边缘卡片与容器边缘间距一致，形成视觉整体感>"） 
    （[动画安全检查], "<GSAP动画前验证：使用document.querySelector()检查目标元素存在性；仅在元素存在时执行动画；添加try-catch包裹动画代码；动画选择器与HTML元素ID/Class严格对应；避免选择器拼写错误>"）                                                                              
    （[PDF文件下载], "<PDF下载功能实现：使用html2canvas + jsPDF生成横向16:9 PDF，每幕单独渲染为一页；PDF版本移除所有GSAP动效和过渡效果，使用静态最终状态；确保字体、图表、布局在PDF中完整显示，无截断或变形；PDF页面尺寸计算：pageWidth = 297mm, pageHeight = 210mm（A4横向）或等比例16:9；添加下载按钮，位置与翻页器并列；处理图表和复杂布局的PDF兼容性"）    
            

- 生成演示代码完成后，创建README.md文件，内容包含：
  - 项目介绍和演示说明
  - 技术栈说明
  - 使用方法
  - 文件结构
  - 浏览器兼容性
  - 分镜信息概览