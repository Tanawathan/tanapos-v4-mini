import React from 'react'
import { useNavigate } from 'react-router-dom'

// 高階組件，為頁面添加路由導航功能
interface WithRouterNavigationProps {
  onBack?: () => void
  onNavigateToHome?: () => void
}

export function withRouterNavigation<T extends WithRouterNavigationProps>(
  WrappedComponent: React.ComponentType<T>
) {
  return function NavigationWrapper(props: Omit<T, 'onBack' | 'onNavigateToHome'>) {
    const navigate = useNavigate()

    const enhancedProps = {
      ...props,
      onBack: () => navigate(-1), // 返回上一頁
      onNavigateToHome: () => navigate('/'), // 返回首頁
    } as T

    return <WrappedComponent {...enhancedProps} />
  }
}

// 導航工具函數 Hook
export function useAppNavigation() {
  const navigate = useNavigate()

  return {
    goBack: () => navigate(-1),
    goHome: () => navigate('/'),
    goTo: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
  }
}
