import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Input, Button, message, Spin, Divider, Space, Modal, List } from 'antd'
import { SaveOutlined, KeyOutlined, EditOutlined, RobotOutlined, CheckOutlined } from '@ant-design/icons'
import RichEditor from '../../components/RichEditor'
import { useProjectStore } from '../../stores/project'
import { initGemini, generateBookTitle, isGeminiReady } from '../../services/gemini'

function Settings() {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject, loadProject, updateProject } = useProjectStore()

  const [worldSetting, setWorldSetting] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isKeyModified, setIsKeyModified] = useState(false)

  // 书名相关状态
  const [bookTitle, setBookTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [showTitleModal, setShowTitleModal] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId, loadProject])

  useEffect(() => {
    if (currentProject) {
      setWorldSetting(currentProject.worldSetting || '')
      setBookTitle(currentProject.title || '')
    }
  }, [currentProject])

  // 加载 API Key
  useEffect(() => {
    const loadApiKey = async () => {
      const key = await window.electron.settings.get('geminiApiKey')
      if (key) {
        // 显示遮蔽后的 key
        setGeminiApiKey(key.slice(0, 8) + '...' + key.slice(-4))
      }
    }
    loadApiKey()
  }, [])

  // 保存书名
  const handleSaveTitle = async () => {
    if (!projectId || !bookTitle.trim()) {
      message.warning('书名不能为空')
      return
    }

    setIsSavingTitle(true)
    try {
      await updateProject(projectId, { title: bookTitle.trim() })
      setIsEditingTitle(false)
      message.success('书名已保存')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setIsSavingTitle(false)
    }
  }

  // AI 生成书名建议
  const handleGenerateTitles = async () => {
    if (!isGeminiReady()) {
      message.warning('请先配置 Gemini API Key')
      return
    }

    setIsGeneratingTitles(true)
    setShowTitleModal(true)
    setTitleSuggestions([])

    try {
      const titles = await generateBookTitle(
        currentProject?.inspiration || '',
        currentProject?.genres || []
      )
      setTitleSuggestions(titles)
    } catch (error: any) {
      message.error(error.message || 'AI 生成失败')
      setShowTitleModal(false)
    } finally {
      setIsGeneratingTitles(false)
    }
  }

  // 选择 AI 生成的书名
  const handleSelectTitle = async (title: string) => {
    if (!projectId) return

    setIsSavingTitle(true)
    try {
      await updateProject(projectId, { title })
      setBookTitle(title)
      setShowTitleModal(false)
      setIsEditingTitle(false)
      message.success('书名已更新')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setIsSavingTitle(false)
    }
  }

  // 保存世界观设定
  const handleSaveWorldSetting = async () => {
    if (!projectId) return

    setIsSaving(true)
    try {
      await updateProject(projectId, { worldSetting })
      message.success('世界观设定已保存')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 保存 API Key
  const handleSaveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      message.warning('请输入 API Key')
      return
    }

    // 如果是遮蔽的 key 且没有修改，不保存
    if (geminiApiKey.includes('...') && !isKeyModified) {
      message.info('API Key 未修改')
      return
    }

    try {
      await window.electron.settings.set('geminiApiKey', geminiApiKey)
      const success = await initGemini(geminiApiKey)
      if (success) {
        message.success('API Key 已保存并验证成功')
        setIsKeyModified(false)
      } else {
        message.warning('API Key 已保存，但验证失败，请检查是否正确')
      }
    } catch (error) {
      message.error('保存失败')
    }
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div className="p-6 fade-in">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-text mb-1">项目设置</h1>
        <p className="text-dark-muted">管理书名、世界观和 API 配置</p>
      </div>

      {/* 书名设置 */}
      <Card
        className="mb-6"
        title={
          <Space>
            <EditOutlined />
            <span>书名设置</span>
          </Space>
        }
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-dark-text mb-2">当前书名</label>
            {isEditingTitle ? (
              <div className="flex gap-2">
                <Input
                  size="large"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="输入书名"
                  className="flex-1"
                />
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleSaveTitle}
                  loading={isSavingTitle}
                >
                  保存
                </Button>
                <Button
                  onClick={() => {
                    setBookTitle(currentProject?.title || '')
                    setIsEditingTitle(false)
                  }}
                >
                  取消
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-primary-400">
                  {currentProject?.title || '未命名'}
                </span>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => setIsEditingTitle(true)}
                >
                  修改
                </Button>
              </div>
            )}
          </div>

          <Divider className="my-4" />

          <div>
            <label className="block text-dark-text mb-2">AI 生成书名</label>
            <p className="text-dark-muted text-sm mb-3">
              根据你的创作灵感和题材，让 AI 为你推荐合适的书名
            </p>
            <Button
              icon={<RobotOutlined />}
              onClick={handleGenerateTitles}
              loading={isGeneratingTitles}
            >
              AI 推荐书名
            </Button>
          </div>
        </div>
      </Card>

      {/* AI 书名推荐弹窗 */}
      <Modal
        title="AI 推荐书名"
        open={showTitleModal}
        onCancel={() => setShowTitleModal(false)}
        footer={null}
        width={500}
      >
        {isGeneratingTitles ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="text-dark-muted mt-4">AI 正在为你构思书名...</p>
          </div>
        ) : (
          <List
            dataSource={titleSuggestions}
            renderItem={(title) => (
              <List.Item
                className="cursor-pointer hover:bg-dark-hover rounded px-3"
                onClick={() => handleSelectTitle(title)}
              >
                <span className="text-lg">{title}</span>
                <Button type="link" size="small">
                  使用此书名
                </Button>
              </List.Item>
            )}
            locale={{ emptyText: '暂无推荐' }}
          />
        )}
      </Modal>

      {/* 世界观编辑器 */}
      <Card
        className="mb-6"
        title={
          <Space>
            <span>世界观设定</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveWorldSetting}
            loading={isSaving}
          >
            保存
          </Button>
        }
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
        bodyStyle={{ padding: 0, height: 400 }}
      >
        <RichEditor
          content={worldSetting}
          onChange={setWorldSetting}
          placeholder="描述你的世界观设定，包括：&#10;&#10;1. 时代背景&#10;2. 地理环境&#10;3. 社会结构&#10;4. 力量体系/修炼等级&#10;5. 特殊规则&#10;..."
        />
      </Card>

      {/* 力量体系模板 */}
      <Card
        className="mb-6"
        title="力量体系模板"
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        <p className="text-dark-muted mb-4">
          参考以下常见的力量体系模板来构建你的世界：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            size="small"
            title="修仙体系"
            className="hover-card cursor-pointer"
            style={{ background: '#0f0f1a', border: '1px solid #0f3460' }}
            onClick={() => {
              setWorldSetting(`<h2>修仙体系</h2>
<p><strong>境界划分：</strong></p>
<ul>
  <li>炼气期（1-9层）</li>
  <li>筑基期（初期、中期、后期、大圆满）</li>
  <li>金丹期</li>
  <li>元婴期</li>
  <li>化神期</li>
  <li>合体期</li>
  <li>大乘期</li>
  <li>渡劫期</li>
</ul>
<p><strong>修炼资源：</strong>灵石、丹药、法宝、秘籍</p>
<p><strong>战斗方式：</strong>法术、剑诀、神通</p>`)
            }}
          >
            <p className="text-dark-muted text-sm">
              炼气 → 筑基 → 金丹 → 元婴 → 化神 → ...
            </p>
          </Card>

          <Card
            size="small"
            title="玄幻斗气体系"
            className="hover-card cursor-pointer"
            style={{ background: '#0f0f1a', border: '1px solid #0f3460' }}
            onClick={() => {
              setWorldSetting(`<h2>斗气体系</h2>
<p><strong>境界划分：</strong></p>
<ul>
  <li>斗者</li>
  <li>斗师</li>
  <li>大斗师</li>
  <li>斗灵</li>
  <li>斗王</li>
  <li>斗皇</li>
  <li>斗宗</li>
  <li>斗尊</li>
  <li>斗圣</li>
  <li>斗帝</li>
</ul>
<p><strong>斗技等级：</strong>黄、玄、地、天</p>
<p><strong>异火排名：</strong>异火榜前二十...</p>`)
            }}
          >
            <p className="text-dark-muted text-sm">
              斗者 → 斗师 → 斗灵 → 斗王 → 斗帝
            </p>
          </Card>

          <Card
            size="small"
            title="都市超能体系"
            className="hover-card cursor-pointer"
            style={{ background: '#0f0f1a', border: '1px solid #0f3460' }}
            onClick={() => {
              setWorldSetting(`<h2>超能力体系</h2>
<p><strong>能力等级：</strong></p>
<ul>
  <li>F级 - 普通人</li>
  <li>E级 - 初级觉醒者</li>
  <li>D级 - 正式超能者</li>
  <li>C级 - 精英</li>
  <li>B级 - 战略级</li>
  <li>A级 - 国家级</li>
  <li>S级 - 灾难级</li>
  <li>SS级 - 神话级</li>
</ul>
<p><strong>能力类型：</strong>物理强化、元素控制、精神系、空间系、时间系</p>`)
            }}
          >
            <p className="text-dark-muted text-sm">F → E → D → C → B → A → S → SS</p>
          </Card>

          <Card
            size="small"
            title="西方魔法体系"
            className="hover-card cursor-pointer"
            style={{ background: '#0f0f1a', border: '1px solid #0f3460' }}
            onClick={() => {
              setWorldSetting(`<h2>魔法体系</h2>
<p><strong>魔法等级：</strong></p>
<ul>
  <li>学徒 - 入门级</li>
  <li>正式法师 - 1-3环</li>
  <li>高级法师 - 4-6环</li>
  <li>大法师 - 7-8环</li>
  <li>法圣 - 9环</li>
  <li>传奇法师 - 禁咒</li>
</ul>
<p><strong>魔法派系：</strong>元素、召唤、死灵、附魔、炼金</p>
<p><strong>资源：</strong>魔晶、魔法材料、魔法阵</p>`)
            }}
          >
            <p className="text-dark-muted text-sm">学徒 → 法师 → 大法师 → 法圣</p>
          </Card>
        </div>
      </Card>

      <Divider />

      {/* API 配置 */}
      <Card
        title={
          <Space>
            <KeyOutlined />
            <span>Gemini API 配置</span>
          </Space>
        }
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        <p className="text-dark-muted mb-4">
          配置 Google Gemini API Key 以启用 AI 写作功能。
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 ml-2"
            onClick={(e) => {
              e.preventDefault()
              window.electron.system.openExternal(
                'https://aistudio.google.com/app/apikey'
              )
            }}
          >
            获取 API Key
          </a>
        </p>

        <div className="flex gap-4">
          <Input.Password
            placeholder="输入你的 Gemini API Key"
            value={geminiApiKey}
            onChange={(e) => {
              setGeminiApiKey(e.target.value)
              setIsKeyModified(true)
            }}
            className="flex-1"
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveApiKey}
          >
            保存并验证
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Settings
