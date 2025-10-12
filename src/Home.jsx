import { useNavigate } from 'react-router-dom'


function Home() {
    const navigate = useNavigate()

    const onHomeButton = () => {
        navigate('/Login')
    }
    return (
            <div className="app">
      <h1 className="main-title">whynotMap</h1>
      <button className="main-button" onClick={onHomeButton}>why tf not</button>
    </div>

    )
}


export default Home