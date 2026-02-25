function LoginPage({ onLogin }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '6px', border: '1px solid #ddd', width: '320px' }}>
        <h2 style={{ marginTop: 0 }}>Sign In</h2>

        <label>Email</label>
        <br />
        <input type="text" style={{ width: '100%', padding: '8px', marginBottom: '16px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />

        <label>Password</label>
        <br />
        <input type="password" style={{ width: '100%', padding: '8px', marginBottom: '20px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />

        <button
          onClick={onLogin}
          style={{ width: '100%', padding: '10px', background: '#3b5bdb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
