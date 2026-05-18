/**
 * 国际化（i18n）系统
 * 
 * 功能概述：
 * - 提供中英文双语言支持
 * - 使用 React Context 管理语言状态
 * - 支持参数化翻译（如 {count}）
 * - 语言设置持久化到 localStorage
 * 
 * 使用方式：
 * - 在组件中使用 useTranslation() 获取 t 函数
 * - 使用 t('key') 或 t('key', { param: value }) 进行翻译
 * - 使用 changeLang() 或 toggleLang() 切换语言
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { en } from './locale/en';
import { zh } from './locale/zh';

/**
 * i18n Context
 * 用于在组件树中传递国际化相关状态和方法
 */
const I18nContext = createContext();

/**
 * 支持的语言列表
 * 
 * @type {Array<Object>}
 * @property {string} code - 语言代码
 * @property {string} name - 语言名称
 * @property {string} flag - 国旗 emoji
 */
export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

/**
 * 语言包对象
 * 包含所有支持的语言的翻译内容
 */
const locales = {
  en,
  zh
};

/**
 * i18n Provider 组件
 * 为整个应用提供国际化功能
 * 
 * @param {React.ReactNode} children - 子组件
 */
export function I18nProvider({ children }) {
  // 语言状态，优先从 localStorage 读取
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('fhe-payroll-lang');
    return saved || 'en';
  });

  // 语言变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('fhe-payroll-lang', lang);
  }, [lang]);

  /**
   * 翻译函数
   * 
   * @param {string} key - 翻译键（支持点号嵌套，如 'navbar.home'）
   * @param {Object} params - 参数对象，用于替换 {param} 占位符
   * @returns {string|any} 翻译结果
   */
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = locales[lang];
    for (const k of keys) {
      value = value?.[k];
      if (!value) return key;
    }
    // 替换 {count} 等占位符为实际值
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }
    return value;
  };

  /**
   * 切换语言（在中英文之间切换）
   */
  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  /**
   * 切换到指定语言
   * 
   * @param {string} newLang - 目标语言代码（'en' 或 'zh'）
   */
  const changeLang = (newLang) => {
    setLang(newLang);
  };

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang, changeLang }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * 国际化 Hook
 * 在组件中使用，获取翻译相关状态和方法
 * 
 * @returns {Object} 国际化状态和方法
 * @property {string} lang - 当前语言代码
 * @property {Function} t - 翻译函数
 * @property {Function} toggleLang - 切换语言函数
 * @property {Function} changeLang - 设置指定语言函数
 */
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
