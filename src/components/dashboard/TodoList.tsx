'use client'

import { useState, useEffect } from 'react'
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

  const fetchTodos = async () => {
    try {
      setLoading(true)
      setError(null)

      // セッションの確認
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

      const { data, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('データ取得エラー:', fetchError)
        throw fetchError
      }

      setTodos(data || [])
    } catch (error) {
      console.error('TODOの取得に失敗しました:', error)
      setError('TODOの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

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