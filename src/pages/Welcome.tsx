import './Welcome.css'

export default function Welcome() {

    return (
        <div className='welcome-container'>
            <div className='welcome-content'>
                <h1 className='welcome-title'>Welcome to HeurAIDEAS</h1>
                <p className='welcome-subtitle'>Short description of the project's aims</p>

                <div className='welcome-buttons'>
                    <button className='btn btn-primary'>See more information</button>
                    <button className='btn btn-primary'>Connect to HeurAIDEAS</button>
                </div>
            </div>
        </div>
    );
}