import { useEffect, useState } from 'react'
import { Card, Input, Button, message, Space, Alert, Switch, Select, Badge, Slider, Tooltip, Tag } from 'antd'
import {
  SaveOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  SyncOutlined,
  QuestionCircleOutlined,
  CloudServerOutlined,
  ApiOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  GoogleOutlined
} from '@ant-design/icons'
import {
  initGemini,
  checkQuota,
  findAvailableModel,
  switchModel,
  getCurrentModelName,
  AVAILABLE_MODELS,
  type QuotaInfo
} from '../../services/gemini'
import type { ServerUser } from '../../types'

function GlobalSettings() {
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [isKeyModified, setIsKeyModified] = useState(false)
  const [geminiConfigured, setGeminiConfigured] = useState(false)

  // 代理配置
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [proxyUrl, setProxyUrl] = useState('')
  const [isProxyModified, setIsProxyModified] = useState(false)

  // 配额和模型配置
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null)
  const [isCheckingQuota, setIsCheckingQuota] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(getCurrentModelName())
  const [isSwitchingModel, setIsSwitchingModel] = useState(false)

  // 自动更新配置
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)
  const [summaryInterval, setSummaryInterval] = useState(20)
  const [characterInterval, setCharacterInterval] = useState(30)

  // 服务端配置
  const [serverUrl, setServerUrl] = useState('https://storyglint.com')
  const [isServerUrlModified, setIsServerUrlModified] = useState(false)
  const [serverUser, setServerUser] = useState<ServerUser | null>(null)
  const [isServerLoggedIn, setIsServerLoggedIn] = useState(false)
  const [isServerLoading, setIsServerLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')

  // 加载保存的配置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const apiKey = await window.electron.settings.get('geminiApiKey')
        const proxyEnabledValue = await window.electron.settings.get('proxyEnabled')
        const proxyUrlValue = await window.electron.settings.get('proxyUrl')
        const savedModel = await window.electron.settings.get('geminiModel')

        if (apiKey) {
          setGeminiApiKey(maskKey(apiKey))
          setGeminiConfigured(true)
          // 初始化时使用保存的模型
          if (savedModel && savedModel in AVAILABLE_MODELS) {
            setSelectedModel(savedModel as string)
            await initGemini(apiKey, savedModel as string)
          } else {
            await initGemini(apiKey)
          }
          // 自动检查配额
          setTimeout(() => handleCheckQuota(), 500)
        }
        if (proxyEnabledValue !== undefined) {
          setProxyEnabled(proxyEnabledValue as boolean)
        }
        if (proxyUrlValue) {
          setProxyUrl(proxyUrlValue as string)
        }

        // 加载自动更新配置
        const autoUpdateEnabledValue = await window.electron.settings.get('autoUpdateEnabled')
        const summaryIntervalValue = await window.electron.settings.get('summaryInterval')
        const characterIntervalValue = await window.electron.settings.get('characterInterval')

        if (autoUpdateEnabledValue !== undefined) {
          setAutoUpdateEnabled(autoUpdateEnabledValue as boolean)
        }
        if (summaryIntervalValue) {
          setSummaryInterval(summaryIntervalValue as number)
        }
        if (characterIntervalValue) {
          setCharacterInterval(characterIntervalValue as number)
        }

        // 加载服务端配置
        try {
          const savedServerUrl = await window.electron.serverAuth.getServerUrl()
          if (savedServerUrl) {
            setServerUrl(savedServerUrl)
          }

          // 检查服务端登录状态
          const loggedIn = await window.electron.serverAuth.isLoggedIn()
          setIsServerLoggedIn(loggedIn)

          if (loggedIn) {
            const user = await window.electron.serverAuth.getUser()
            setServerUser(user)
          }
        } catch (error) {
          console.error('Failed to load server settings:', error)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    loadSettings()
  }, [])

  // 遮蔽密钥显示
  const maskKey = (key: string): string => {
    if (key.length <= 12) return '••••••••'
    return key.slice(0, 6) + '••••••••' + key.slice(-4)
  }

  // 保存 Gemini API Key
  const handleSaveGeminiKey = async () => {
    if (!geminiApiKey.trim() || geminiApiKey.includes('••••')) {
      if (!isKeyModified) {
        message.info('API Key 未修改')
        return
      }
    }

    try {
      await window.electron.settings.set('geminiApiKey', geminiApiKey)
      const success = await initGemini(geminiApiKey, selectedModel)
      if (success) {
        message.success('Gemini API Key 已保存并验证成功')
        setGeminiConfigured(true)
        setIsKeyModified(false)
        setGeminiApiKey(maskKey(geminiApiKey))
        // 自动检查配额
        handleCheckQuota()
      } else {
        message.warning('API Key 已保存，但验证失败，请检查是否正确')
      }
    } catch (error: any) {
      message.error(`保存失败: ${error.message || String(error)}`)
    }
  }

  // 检查配额
  const handleCheckQuota = async () => {
    if (!geminiConfigured) {
      message.warning('请先配置并保存 API Key')
      return
    }

    setIsCheckingQuota(true)
    try {
      const info = await checkQuota()
      setQuotaInfo(info)

      if (info.isValid && !info.quotaExceeded) {
        message.success('配额检查通过，API 运行正常')
      } else if (info.quotaExceeded) {
        message.warning('配额已用尽，请检查您的 API 计划')
      } else {
        message.error(info.error || 'API 验证失败')
      }
    } catch (error: any) {
      message.error(`检查失败: ${error.message || String(error)}`)
      setQuotaInfo({
        isValid: false,
        model: selectedModel,
        error: error.message || String(error)
      })
    } finally {
      setIsCheckingQuota(false)
    }
  }

  // 查找可用模型
  const handleFindAvailableModel = async () => {
    if (!geminiConfigured) {
      message.warning('请先配置并保存 API Key')
      return
    }

    setIsCheckingQuota(true)
    const hideLoading = message.loading('正在测试所有模型...', 0)

    try {
      const { availableModel, results } = await findAvailableModel()

      hideLoading()

      if (availableModel) {
        message.success(`找到可用模型: ${availableModel}`)
        setSelectedModel(availableModel)
        await handleSwitchModel(availableModel)
      } else {
        const failureInfo = Object.entries(results)
          .map(([model, info]) => `${model}: ${info.error || '失败'}`)
          .join('\n')
        message.error(`所有模型均不可用:\n${failureInfo}`)
      }

      console.log('Model test results:', results)
    } catch (error: any) {
      hideLoading()
      message.error(`测试失败: ${error.message || String(error)}`)
    } finally {
      setIsCheckingQuota(false)
    }
  }

  // 切换模型
  const handleSwitchModel = async (modelName: string) => {
    if (!geminiConfigured) {
      message.warning('请先配置并保存 API Key')
      return
    }

    setIsSwitchingModel(true)
    try {
      await switchModel(modelName as keyof typeof AVAILABLE_MODELS)
      await window.electron.settings.set('geminiModel', modelName)
      setSelectedModel(modelName)
      message.success(`已切换到模型: ${modelName}`)
      // 切换后自动检查配额
      handleCheckQuota()
    } catch (error: any) {
      message.error(`切换失败: ${error.message || String(error)}`)
    } finally {
      setIsSwitchingModel(false)
    }
  }

  // 保存代理配置
  const handleSaveProxyConfig = async () => {
    if (!isProxyModified) {
      message.info('代理配置未修改')
      return
    }

    try {
      await window.electron.settings.set('proxyEnabled', proxyEnabled)
      await window.electron.settings.set('proxyUrl', proxyUrl.trim())
      message.success('代理配置已保存，重启应用后生效')
      setIsProxyModified(false)
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 保存自动更新配置
  const handleSaveAutoUpdateConfig = async () => {
    try {
      await window.electron.settings.set('autoUpdateEnabled', autoUpdateEnabled)
      await window.electron.settings.set('summaryInterval', summaryInterval)
      await window.electron.settings.set('characterInterval', characterInterval)
      message.success('自动更新配置已保存')
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 测试服务端连接（通过主进程）
  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('unknown')

    try {
      const result = await window.electron.serverAuth.testConnection(serverUrl)

      if (result.success) {
        setConnectionStatus('success')
        message.success('服务端连接成功')
      } else {
        setConnectionStatus('error')
        message.error(`连接失败: ${result.error || '未知错误'}`)
      }
    } catch (error: any) {
      setConnectionStatus('error')
      message.error(`连接失败: ${error.message || '未知错误'}`)
    } finally {
      setIsTestingConnection(false)
    }
  }

  // 保存服务端地址
  const handleSaveServerUrl = async () => {
    if (!serverUrl.trim()) {
      message.warning('请输入服务端地址')
      return
    }

    try {
      // 验证 URL 格式
      new URL(serverUrl)
    } catch {
      message.error('请输入有效的 URL 地址')
      return
    }

    try {
      await window.electron.serverAuth.setServerUrl(serverUrl.trim())
      message.success('服务端地址已保存')
      setIsServerUrlModified(false)
      // 保存后自动测试连接
      handleTestConnection()
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 服务端登录
  const handleServerLogin = async () => {
    setIsServerLoading(true)
    setServerError(null)

    try {
      const result = await window.electron.serverAuth.login()

      if (result.success && result.user) {
        setServerUser(result.user)
        setIsServerLoggedIn(true)

        if (result.user.status === 'pending') {
          message.warning('您的账号正在等待管理员审批')
        } else if (result.user.status === 'approved') {
          message.success(`登录成功，欢迎 ${result.user.name || result.user.email}`)
        } else if (result.user.status === 'rejected') {
          message.error('您的账号申请已被拒绝')
        } else if (result.user.status === 'suspended') {
          message.error('您的账号已被暂停')
        }
      } else {
        setServerError(result.error || '登录失败')
        message.error(result.error || '登录失败')
      }
    } catch (error: any) {
      setServerError(error.message || '登录失败')
      message.error(error.message || '登录失败')
    } finally {
      setIsServerLoading(false)
    }
  }

  // 服务端登出
  const handleServerLogout = async () => {
    try {
      await window.electron.serverAuth.logout()
      setServerUser(null)
      setIsServerLoggedIn(false)
      message.success('已退出登录')
    } catch (error) {
      message.error('退出登录失败')
    }
  }

  // 刷新用户状态
  const handleRefreshUserStatus = async () => {
    if (!isServerLoggedIn) return

    try {
      const status = await window.electron.serverAuth.checkUserStatus()
      const user = await window.electron.serverAuth.getUser()
      setServerUser(user)

      if (status.isApproved) {
        message.success('账号已通过审批')
      } else {
        message.info(status.message || `当前状态: ${status.status}`)
      }
    } catch (error) {
      message.error('刷新状态失败')
    }
  }

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green'
      case 'pending': return 'orange'
      case 'rejected': return 'red'
      case 'suspended': return 'gray'
      default: return 'default'
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '已批准'
      case 'pending': return '待审批'
      case 'rejected': return '已拒绝'
      case 'suspended': return '已暂停'
      default: return status
    }
  }

  return (
    <div className="p-6 fade-in max-w-4xl mx-auto">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-text mb-1">全局设置</h1>
        <p className="text-dark-muted">配置 API 密钥和账户登录</p>
      </div>

      {/* 服务端配置 */}
      <Card
        title={
          <Space>
            <CloudServerOutlined className="text-green-500" />
            <span>NovaScribe 服务端</span>
            {connectionStatus === 'success' && <CheckCircleOutlined className="text-green-500" />}
            {connectionStatus === 'error' && <ExclamationCircleOutlined className="text-red-500" />}
          </Space>
        }
        className="mb-6"
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        <Alert
          message="连接自建服务端"
          description="配置您的 NovaScribe 服务端地址，实现数据云同步和多设备协作。服务端提供用户管理、数据备份等功能。"
          type="info"
          showIcon
          className="mb-4"
        />

        {/* 服务端地址配置 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-dark-text mb-2">
              <Space>
                <ApiOutlined />
                服务端地址
              </Space>
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="例如：https://storyglint.com 或 https://your-domain.com"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value)
                  setIsServerUrlModified(true)
                  setConnectionStatus('unknown')
                }}
                className="flex-1"
              />
              <Button
                icon={<ReloadOutlined spin={isTestingConnection} />}
                onClick={handleTestConnection}
                loading={isTestingConnection}
              >
                测试
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveServerUrl}
                disabled={!isServerUrlModified}
              >
                保存
              </Button>
            </div>
            <div className="text-dark-muted text-xs mt-1">
              支持 HTTP 和 HTTPS 协议，确保服务端已启动并可访问
            </div>
          </div>
        </div>

        {/* 服务端登录状态 */}
        {isServerLoggedIn && serverUser ? (
          <div className="border border-dark-border rounded-lg p-4 bg-dark-bg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {serverUser.picture ? (
                  <img
                    src={serverUser.picture}
                    alt={serverUser.name || serverUser.email}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                    <UserOutlined className="text-white text-xl" />
                  </div>
                )}
                <div>
                  <div className="text-dark-text font-medium">
                    {serverUser.name || serverUser.email}
                  </div>
                  <div className="text-dark-muted text-sm">{serverUser.email}</div>
                  <div className="mt-1">
                    <Tag color={getStatusColor(serverUser.status)}>
                      {getStatusText(serverUser.status)}
                    </Tag>
                    {serverUser.role === 'admin' && (
                      <Tag color="purple">管理员</Tag>
                    )}
                  </div>
                </div>
              </div>
              <Space>
                {serverUser.status === 'pending' && (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefreshUserStatus}
                  >
                    刷新状态
                  </Button>
                )}
                <Button danger onClick={handleServerLogout}>
                  退出登录
                </Button>
              </Space>
            </div>

            {serverUser.status === 'pending' && (
              <Alert
                message="等待审批"
                description="您的账号正在等待管理员审批，审批通过后即可使用同步功能。"
                type="warning"
                showIcon
                className="mt-4"
              />
            )}

            {serverUser.status === 'approved' && (
              <div className="mt-4">
                <Alert
                  message="账号已激活"
                  description="您可以使用服务端同步功能，在多个设备间同步您的作品。"
                  type="success"
                  showIcon
                  className="mb-4"
                />
                <Space>
                  <Button
                    type="primary"
                    icon={<SyncOutlined />}
                    onClick={async () => {
                      const hideLoading = message.loading('正在同步...', 0)
                      try {
                        const result = await window.electron.serverSync.sync()
                        hideLoading()
                        if (result.success) {
                          message.success(`同步完成！上传 ${result.uploaded || 0} 个，下载 ${result.downloaded || 0} 个`)
                        } else {
                          message.error(result.error || '同步失败')
                        }
                      } catch (error: any) {
                        hideLoading()
                        message.error(error.message || '同步失败')
                      }
                    }}
                  >
                    立即同步
                  </Button>
                  <Button
                    icon={<CloudServerOutlined />}
                    onClick={async () => {
                      const hideLoading = message.loading('正在从服务端恢复数据...', 0)
                      try {
                        const result = await window.electron.serverSync.restore()
                        hideLoading()
                        if (result.success) {
                          message.success(`恢复完成！导入 ${result.importedCount || 0} 个项目`)
                        } else {
                          message.error(result.error || '恢复失败')
                        }
                      } catch (error: any) {
                        hideLoading()
                        message.error(error.message || '恢复失败')
                      }
                    }}
                  >
                    从服务端恢复
                  </Button>
                </Space>
              </div>
            )}

            {serverUser.status === 'rejected' && (
              <Alert
                message="账号被拒绝"
                description="您的账号申请已被管理员拒绝，如有疑问请联系管理员。"
                type="error"
                showIcon
                className="mt-4"
              />
            )}

            {serverUser.status === 'suspended' && (
              <Alert
                message="账号已暂停"
                description="您的账号已被暂停，暂时无法使用同步功能。"
                type="error"
                showIcon
                className="mt-4"
              />
            )}
          </div>
        ) : (
          <div className="border border-dark-border rounded-lg p-4 bg-dark-bg">
            {serverError && (
              <Alert
                message="登录失败"
                description={serverError}
                type="error"
                showIcon
                closable
                onClose={() => setServerError(null)}
                className="mb-4"
              />
            )}

            {isServerLoading && (
              <Alert
                message="正在登录..."
                description="请在浏览器中完成 Google 授权，完成后会自动返回应用。"
                type="warning"
                showIcon
                className="mb-4"
              />
            )}

            <div className="text-center py-4">
              <p className="text-dark-muted mb-4">
                登录服务端后可将作品同步到云端，支持多设备访问
              </p>
              <Button
                type="primary"
                size="large"
                icon={<GoogleOutlined />}
                onClick={handleServerLogin}
                loading={isServerLoading}
                disabled={connectionStatus !== 'success'}
                className="gradient-button"
              >
                {isServerLoading ? '等待授权...' : '使用 Google 账户登录服务端'}
              </Button>
              {connectionStatus !== 'success' && (
                <div className="text-dark-muted text-sm mt-2">
                  请先测试服务端连接
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* 代理配置 */}
      <Card
        title={
          <Space>
            <GlobalOutlined className="text-cyan-500" />
            <span>网络代理配置</span>
          </Space>
        }
        className="mb-6"
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        <Alert
          message="重要提示：访问 Google 服务需要配置代理"
          description={
            <div className="space-y-2 mt-2">
              <p>如果你在中国大陆，需要配置代理才能正常使用 Google 登录和云同步功能。</p>
              <p><strong>推荐配置：</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>使用系统代理</strong>：启用代理，代理地址留空，应用会自动使用系统代理设置</li>
                <li><strong>手动配置</strong>：如果系统代理不生效，可以手动输入代理地址（如：http://127.0.0.1:7890 或 socks5://127.0.0.1:7890）</li>
              </ol>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-dark-text font-medium mb-1">启用代理</div>
              <div className="text-dark-muted text-sm">
                开启后可访问 Google 服务（需要重启应用）
              </div>
            </div>
            <Switch
              checked={proxyEnabled}
              onChange={(checked) => {
                setProxyEnabled(checked)
                setIsProxyModified(true)
              }}
            />
          </div>

          {proxyEnabled && (
            <div>
              <label className="block text-dark-text mb-2">
                代理地址（可选，留空使用系统代理）
              </label>
              <Input
                placeholder="例如：http://127.0.0.1:7890 或 socks5://127.0.0.1:7890"
                value={proxyUrl}
                onChange={(e) => {
                  setProxyUrl(e.target.value)
                  setIsProxyModified(true)
                }}
              />
              <div className="text-dark-muted text-xs mt-1">
                支持的格式：http://host:port, https://host:port, socks5://host:port
              </div>
            </div>
          )}

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveProxyConfig}
            disabled={!isProxyModified}
          >
            保存代理配置
          </Button>

          {isProxyModified && (
            <Alert
              message="保存后需要重启应用才能生效"
              type="info"
              showIcon
            />
          )}
        </div>
      </Card>

      {/* 自动更新配置 */}
      <Card
        title={
          <Space>
            <SyncOutlined className="text-blue-500" />
            <span>智能写作优化</span>
          </Space>
        }
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        <Alert
          message="Token消耗优化"
          description="合理配置自动更新频率可以大幅降低API调用次数，节省Token消耗。推荐保持默认设置。"
          type="info"
          showIcon
          className="mb-4"
        />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoUpdateEnabled}
              onChange={(checked) => setAutoUpdateEnabled(checked)}
            />
            <span className="text-dark-text">启用自动更新</span>
            <Tooltip title="关闭后将不会自动生成全书摘要和更新角色档案，需要手动到角色档案页面更新">
              <QuestionCircleOutlined className="text-dark-muted cursor-help" />
            </Tooltip>
          </div>

          {autoUpdateEnabled && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-dark-text">全书摘要更新频率</span>
                  <span className="text-primary-500">{summaryInterval} 章</span>
                </div>
                <Slider
                  min={10}
                  max={50}
                  step={5}
                  value={summaryInterval}
                  onChange={(value) => setSummaryInterval(value)}
                  marks={{
                    10: '10章',
                    20: '20章',
                    30: '30章',
                    40: '40章',
                    50: '50章'
                  }}
                />
                <div className="text-dark-muted text-xs mt-1">
                  全书摘要用于保持长篇连贯性，更新越频繁效果越好，但token消耗也越多
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-dark-text">角色档案更新频率</span>
                  <span className="text-primary-500">{characterInterval} 章</span>
                </div>
                <Slider
                  min={10}
                  max={100}
                  step={10}
                  value={characterInterval}
                  onChange={(value) => setCharacterInterval(value)}
                  marks={{
                    10: '10章',
                    30: '30章',
                    50: '50章',
                    70: '70章',
                    100: '100章'
                  }}
                />
                <div className="text-dark-muted text-xs mt-1">
                  自动分析角色生死、出场、关系。频率越低越省token，但可能导致死亡角色在后续章节出现
                </div>
              </div>

              <Alert
                message={
                  <div>
                    <div className="font-medium mb-1">Token消耗估算</div>
                    <div className="text-xs">
                      • 全书摘要：每{summaryInterval}章约消耗 2000-3000 tokens<br />
                      • 角色档案：每{characterInterval}章约消耗 1000-2000 tokens<br />
                      • 100章小说预计总消耗：{Math.ceil(100 / summaryInterval) * 2500 + Math.ceil(100 / characterInterval) * 1500} tokens
                    </div>
                  </div>
                }
                type="warning"
                showIcon
              />
            </>
          )}

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveAutoUpdateConfig}
          >
            保存配置
          </Button>
        </div>
      </Card>

      {/* Gemini API 配置 */}
      <Card
        title={
          <Space>
            <KeyOutlined className="text-purple-500" />
            <span>Gemini API 配置</span>
            {geminiConfigured && quotaInfo?.isValid && !quotaInfo.quotaExceeded && (
              <CheckCircleOutlined className="text-green-500" />
            )}
            {quotaInfo?.quotaExceeded && (
              <WarningOutlined className="text-orange-500" />
            )}
          </Space>
        }
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        <Alert
          message="Gemini API 用于 AI 写作功能"
          description="配置 API Key 后可使用 AI 生成大纲、角色设定、自动续写等功能。推荐使用 Gemini 2.0 Flash 模型进行大纲生成。"
          type="info"
          showIcon
          className="mb-4"
        />

        {/* 配额状态显示 */}
        {quotaInfo && (
          <Alert
            message={
              <Space>
                {quotaInfo.isValid && !quotaInfo.quotaExceeded ? (
                  <><CheckCircleOutlined className="text-green-500" /> API 状态正常</>
                ) : quotaInfo.quotaExceeded ? (
                  <><WarningOutlined className="text-orange-500" /> 配额已用尽</>
                ) : (
                  <><WarningOutlined className="text-red-500" /> API 验证失败</>
                )}
              </Space>
            }
            description={
              <div className="space-y-1">
                <div>当前模型: <Badge color="blue" text={quotaInfo.model} /></div>
                {quotaInfo.error && <div className="text-red-400">{quotaInfo.error}</div>}
                {quotaInfo.quotaExceeded && (
                  <div className="mt-2">
                    <strong>解决方案：</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>等待配额重置（通常每24小时重置一次）</li>
                      <li>使用新的 API Key（<a href="#" className="text-primary-400" onClick={(e) => {
                        e.preventDefault()
                        window.electron.system.openExternal('https://aistudio.google.com/apikey')
                      }}>获取新 Key</a>）</li>
                      <li>点击下方"查找可用模型"尝试切换到其他模型</li>
                    </ol>
                  </div>
                )}
              </div>
            }
            type={quotaInfo.isValid && !quotaInfo.quotaExceeded ? 'success' : quotaInfo.quotaExceeded ? 'warning' : 'error'}
            showIcon
            className="mb-4"
          />
        )}

        <div className="space-y-4">
          {/* 模型选择 */}
          <div>
            <label className="block text-dark-text mb-2">
              <Space>
                <ThunderboltOutlined />
                选择模型
                {AVAILABLE_MODELS[selectedModel as keyof typeof AVAILABLE_MODELS]?.recommended && (
                  <Badge color="green" text="推荐" />
                )}
              </Space>
            </label>
            <Select
              value={selectedModel}
              onChange={handleSwitchModel}
              loading={isSwitchingModel}
              disabled={!geminiConfigured}
              className="w-full"
              options={Object.entries(AVAILABLE_MODELS).map(([key, value]) => ({
                label: (
                  <Space>
                    {value.name}
                    {value.recommended && <Badge color="green" text="推荐" />}
                  </Space>
                ),
                value: key,
                title: value.description
              }))}
            />
            <div className="text-dark-muted text-xs mt-1">
              {AVAILABLE_MODELS[selectedModel as keyof typeof AVAILABLE_MODELS]?.description}
            </div>
          </div>

          {/* API Key 输入 */}
          <div>
            <label className="block text-dark-text mb-2">API Key</label>
            <div className="flex gap-2">
              <Input.Password
                placeholder="输入 Gemini API Key"
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
                onClick={handleSaveGeminiKey}
              >
                保存并验证
              </Button>
            </div>
          </div>

          {/* 配额检查按钮 */}
          {geminiConfigured && (
            <Space wrap>
              <Button
                icon={<ReloadOutlined spin={isCheckingQuota} />}
                onClick={handleCheckQuota}
                loading={isCheckingQuota}
              >
                检查配额
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                onClick={handleFindAvailableModel}
                loading={isCheckingQuota}
              >
                查找可用模型
              </Button>
            </Space>
          )}

          <div className="text-dark-muted text-sm">
            <a
              href="#"
              className="text-primary-400"
              onClick={(e) => {
                e.preventDefault()
                window.electron.system.openExternal(
                  'https://aistudio.google.com/app/apikey'
                )
              }}
            >
              获取 Gemini API Key →
            </a>
            {' | '}
            <a
              href="#"
              className="text-primary-400"
              onClick={(e) => {
                e.preventDefault()
                window.electron.system.openExternal(
                  'https://ai.google.dev/gemini-api/docs/models/gemini'
                )
              }}
            >
              查看模型文档 →
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default GlobalSettings
