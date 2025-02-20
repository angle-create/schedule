import { supabase } from './client'

const AVATAR_BUCKET = 'avatars'

export const uploadAvatar = async (file: File, userId: string) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath)

    // アバターURLをユーザープロフィールに更新
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    return publicUrl
  } catch (error) {
    console.error('アバターのアップロードに失敗しました:', error)
    throw error
  }
}

export const deleteAvatar = async (userId: string) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (user?.avatar_url) {
      const fileName = user.avatar_url.split('/').pop()
      
      const { error: deleteError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([fileName])

      if (deleteError) {
        throw deleteError
      }

      // アバターURLをクリア
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }
    }
  } catch (error) {
    console.error('アバターの削除に失敗しました:', error)
    throw error
  }
} 