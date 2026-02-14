import { useState } from 'react'
import { Card, Button, Alert, Typography, Space, Collapse } from 'antd'
import {
  CloseCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  CheckOutlined,
  WarningOutlined,
  BugOutlined
} from '@ant-design/icons'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

export interface ErrorInfo {
  title: string
  message: string
  details?: string
  suggestions?: string[]
  timestamp?: Date
}

interface ErrorDisplayProps {
  error: ErrorInfo
  onRetry?: () => void
  onDismiss?: () => void
  retryText?: string
  dismissText?: string
  showTimestamp?: boolean
}

/**
 * 错误显示组件
 * 用于替代 toast 显示详细的错误信息
 */
export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  retryText = '重试',
  dismissText = '关闭',
  showTimestamp = true
}: ErrorDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const errorText = [
      `错误: ${error.title}`,
      `信息: ${error.message}`,
      error.details ? `详情: ${error.details}` : '',
      error.timestamp ? `时间: ${error.timestamp.toLocaleString()}` : ''
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(errorText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('复制失败:', e)
    }
  }

  return (
    <Card
      className="error-display-card"
      style={{
        background: '#1a1a2e',
        border: '1px solid #e74c3c',
        borderRadius: '12px'
      }}
    >
      <div className="text-center mb-6">
        <CloseCircleOutlined
          style={{ fontSize: '64px', color: '#e74c3c' }}
          className="mb-4"
        />
        <h2 className="text-2xl font-bold text-red-400 mb-2">
          {error.title}
        </h2>
      </div>

      <Alert
        message={error.message}
        type="error"
        showIcon
        icon={<WarningOutlined />}
        className="mb-4"
      />

      {error.details && (
        <Collapse
          ghost
          className="mb-4"
          style={{ background: '#0f0f1a', borderRadius: '8px' }}
        >
          <Panel
            header={
              <Space>
                <BugOutlined />
                <span>错误详情</span>
              </Space>
            }
            key="details"
          >
            <Paragraph
              className="text-dark-muted"
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}
            >
              {error.details}
            </Paragraph>
          </Panel>
        </Collapse>
      )}

      {error.suggestions && error.suggestions.length > 0 && (
        <div className="mb-4 p-4 bg-dark-bg rounded-lg">
          <Text strong className="text-dark-text block mb-2">
            建议解决方案:
          </Text>
          <ul className="list-disc list-inside space-y-1">
            {error.suggestions.map((suggestion, index) => (
              <li key={index} className="text-dark-muted text-sm">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showTimestamp && error.timestamp && (
        <div className="text-center text-dark-muted text-xs mb-4">
          发生时间: {error.timestamp.toLocaleString()}
        </div>
      )}

      <div className="flex justify-center gap-3">
        {onRetry && (
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRetry}
            size="large"
          >
            {retryText}
          </Button>
        )}
        {onDismiss && (
          <Button
            onClick={onDismiss}
            size="large"
          >
            {dismissText}
          </Button>
        )}
        <Button
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          size="large"
        >
          {copied ? '已复制' : '复制错误'}
        </Button>
      </div>
    </Card>
  )
}

/**
 * 全屏错误页面组件
 */
interface ErrorPageProps extends ErrorDisplayProps {
  fullScreen?: boolean
}

export function ErrorPage({
  error,
  onRetry,
  onDismiss,
  retryText,
  dismissText,
  fullScreen = true
}: ErrorPageProps) {
  if (fullScreen) {
    return (
      <div className="min-h-full p-6 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <ErrorDisplay
            error={error}
            onRetry={onRetry}
            onDismiss={onDismiss}
            retryText={retryText}
            dismissText={dismissText}
          />
        </div>
      </div>
    )
  }

  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      retryText={retryText}
      dismissText={dismissText}
    />
  )
}

/**
 * 解析错误信息
 */
export function parseError(error: any): ErrorInfo {
  let message = '未知错误'
  let details = ''
  let suggestions: string[] = []

  if (typeof error === 'string') {
    message = error
  } else if (error instanceof Error) {
    message = error.message
    details = error.stack || ''
  } else if (error?.message) {
    message = error.message
    details = error.stack || JSON.stringify(error, null, 2)
  }

  // 根据错误内容添加建议
  if (message.includes('API') || message.includes('api')) {
    suggestions.push('检查 API Key 是否正确配置')
    suggestions.push('确认网络连接正常')
  }

  if (message.includes('quota') || message.includes('配额') || message.includes('429')) {
    suggestions.push('等待配额重置（通常24小时后）')
    suggestions.push('尝试切换到其他可用模型')
    suggestions.push('考虑使用新的 API Key')
  }

  if (message.includes('network') || message.includes('网络') || message.includes('fetch')) {
    suggestions.push('检查网络连接')
    suggestions.push('如果在中国大陆，请确保已配置代理')
    suggestions.push('尝试重新连接')
  }

  if (message.includes('timeout') || message.includes('超时')) {
    suggestions.push('稍后重试')
    suggestions.push('检查网络连接稳定性')
  }

  if (message.includes('model') || message.includes('模型')) {
    suggestions.push('尝试切换到其他模型')
    suggestions.push('在全局设置中点击"查找可用模型"')
  }

  // 默认建议
  if (suggestions.length === 0) {
    suggestions.push('请检查相关配置是否正确')
    suggestions.push('如果问题持续，请联系技术支持')
  }

  return {
    title: '操作失败',
    message,
    details,
    suggestions,
    timestamp: new Date()
  }
}

export default ErrorDisplay
