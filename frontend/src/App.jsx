import React from 'react';
import Summarizer from './components/Summarizer';
import QuestionAnswer from './components/QuestionAnswer';
import MCQGenerator from './components/MCQGenerator';
import PDFReadAloud from './components/PDFReadAloud';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>ScholarNet</h1>
      </header>
      <main>
        <Summarizer />
        <QuestionAnswer />
        <MCQGenerator />
        <PDFReadAloud />
      </main>
    </div>
  );
}

export default App;
