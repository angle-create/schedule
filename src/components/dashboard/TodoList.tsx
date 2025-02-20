'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Todo {
  id: string
  content: string
  is_completed: boolean
  created_at: string
  user_id: string
}

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodos = useCallback(async () => {
    console.log('fetchTodos called')
    try {
      setLoading(true)
      setError(null)

      // セッションの確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('セッション状態:', session?.user?.id, 'エラー:', sessionError)
      
      if (sessionError) {
        console.error('セッションエラー:', sessionError)
        setError('認証に失敗しました')
        setTodos([])
        setLoading(false)
        return
      }
      if (!session?.user?.id) {
        console.log('セッションなし - fetchTodos')
        setError('ログインが必要です')
        setTodos([])
        setLoading(false)
        return
      }

      console.log('データ取得開始:', session.user.id)
      const { data, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      console.log('データ取得結果の詳細:', {
        data,
        error: fetchError,
        dataType: data ? typeof data : 'undefined',
        isArray: Array.isArray(data),
        length: data?.length
      })

      if (fetchError) {
        console.error('データ取得エラー:', fetchError)
        console.error('エラーの詳細:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        })
        throw fetchError
      }

      console.log('取得したデータ:', data)
      console.log('データをステートに設定します')
      setTodos(data || [])
      console.log('Todosステートを更新しました:', todos.length)
    } catch (error) {
      console.error('TODOの取得に失敗しました:', error)
      setError('TODOの取得に失敗しました')
      setTodos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let todoSubscription: any = null

    const initialize = async () => {
      try {
        console.log('初期化開始')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('初期化時のセッションエラー:', sessionError)
          return
        }

        if (session?.user?.id && mounted) {
          console.log('初期化時のセッション確認OK:', session.user.id)
          console.log('初期化時のfetchTodos呼び出し')
          await fetchTodos()

          // リアルタイム更新のセットアップ
          todoSubscription = supabase
            .channel('todos-channel')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'todos',
                filter: `user_id=eq.${session.user.id}`
              },
              async (payload) => {
                console.log('リアルタイム更新:', payload.eventType)
                if (mounted) {
                  console.log('リアルタイム更新によるfetchTodos呼び出し')
                  await fetchTodos()
                }
              }
            )
            .subscribe((status) => {
              console.log('Subscription status:', status)
            })
        } else {
          console.log('初期化時にセッションなし')
          setTodos([])
          setError('ログインが必要です')
        }
      } catch (error) {
        console.error('初期化エラー:', error)
      }
    }

    // 初期化実行
    initialize()

    // visibilitychangeイベントのハンドラー
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('ページがアクティブになりました')
        initialize()
      }
    }

    // visibilitychangeイベントリスナーを追加
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 認証状態の監視
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認証状態変更:', event, session?.user?.id)
        
        if (!mounted) return

        if (session?.user?.id) {
          console.log('認証状態変更: ログイン')
          console.log('認証状態変更時のfetchTodos呼び出し')
          await fetchTodos()

          // 既存のサブスクリプションをクリーンアップ
          if (todoSubscription) {
            todoSubscription.unsubscribe()
          }

          // 新しいサブスクリプションをセットアップ
          todoSubscription = supabase
            .channel('todos-channel')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'todos',
                filter: `user_id=eq.${session.user.id}`
              },
              async (payload) => {
                console.log('リアルタイム更新:', payload.eventType)
                if (mounted) {
                  console.log('リアルタイム更新によるfetchTodos呼び出し')
                  await fetchTodos()
                }
              }
            )
            .subscribe((status) => {
              console.log('Subscription status:', status)
            })
        } else {
          console.log('認証状態変更: ログアウト')
          setTodos([])
          setError('ログインが必要です')
          
          // サブスクリプションのクリーンアップ
          if (todoSubscription) {
            todoSubscription.unsubscribe()
            todoSubscription = null
          }
        }
      }
    )

    // クリーンアップ
    return () => {
      console.log('コンポーネントのクリーンアップ')
      mounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
      if (todoSubscription) {
        todoSubscription.unsubscribe()
      }
    }
  }, [fetchTodos])

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    try {
      setError(null)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('セッションエラー:', sessionError)
        setError('認証に失敗しました')
        return
      }
      if (!session) {
        setError('ログインが必要です')
        return
      }

      const { error: insertError } = await supabase
        .from('todos')
        .insert([
          {
            content: newTodo.trim(),
            user_id: session.user.id,
            is_completed: false
          }
        ])

      if (insertError) {
        console.error('データ追加エラー:', insertError)
        throw insertError
      }

      setNewTodo('')
      fetchTodos()
    } catch (error) {
      console.error('TODOの追加に失敗しました:', error)
      setError('TODOの追加に失敗しました')
    }
  }

  const toggleTodo = async (id: string, isCompleted: boolean) => {
    try {
      setError(null)
      const { error: updateError } = await supabase
        .from('todos')
        .update({ is_completed: !isCompleted })
        .eq('id', id)

      if (updateError) {
        console.error('データ更新エラー:', updateError)
        throw updateError
      }

      fetchTodos()
    } catch (error) {
      console.error('TODOの更新に失敗しました:', error)
      setError('TODOの更新に失敗しました')
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('データ削除エラー:', deleteError)
        throw deleteError
      }

      fetchTodos()
    } catch (error) {
      console.error('TODOの削除に失敗しました:', error)
      setError('TODOの削除に失敗しました')
    }
  }

  if (loading) {
    console.log('ローディング中...')
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl shadow-lg h-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg mr-2">✓</span>
          TODOリスト
        </h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-emerald-50 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  console.log('レンダリング時のtodos:', todos)
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center flex-shrink-0">
        <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg mr-2">✓</span>
        TODOリスト
      </h2>

      <form onSubmit={addTodo} className="mb-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="新しいTODOを入力"
            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            追加
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 flex-shrink-0">
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2 overflow-y-auto flex-1 pr-2">
        {todos.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center">
            <p className="text-gray-500">TODOはありません</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white/50 backdrop-blur-sm border border-emerald-100 rounded-xl p-4 flex items-center justify-between hover:bg-white/80 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="checkbox"
                  checked={todo.is_completed}
                  onChange={() => toggleTodo(todo.id, todo.is_completed)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className={`flex-1 ${todo.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {todo.content}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-200"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 