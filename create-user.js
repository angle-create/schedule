const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xhzdlyvwisdywugstnfi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoemRseXZ3aXNkeXd1Z3N0bmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3NjY0NTYsImV4cCI6MjA1NTM0MjQ1Nn0.5e0uzNVO8rsSUceaMP8z714EI949FtMh7ThazCrZ6r0'
);

async function createUser() {
  // 直接サインインを試みる
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'angle.create@proton.me',
    password: 'pass_angle'
  });

  if (signInError) {
    // サインインに失敗した場合は新規ユーザーを作成
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'angle.create@proton.me',
      password: 'pass_angle',
      options: {
        data: {
          display_name: 'Angle',
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      console.error('Error signing up:', signUpError.message);
      return;
    }

    console.log('User signed up:', signUpData);
  } else {
    console.log('User signed in:', signInData);
  }
}

createUser(); 