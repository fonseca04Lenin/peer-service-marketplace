function MainPage() {
  return (
    <div style={styles.screen}>
      <h1>Welcome</h1>
    </div>
  );
}

const styles = {
  screen: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f2f5',
  },
};

export default MainPage;
