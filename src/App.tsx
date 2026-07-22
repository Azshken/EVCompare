import { useState } from 'react';
import { AppShell } from './components/AppShell';
import { LoanCalcPage } from './components/loancalc/LoanCalcPage';
import { VoltCalcPage } from './components/voltcalc/VoltCalcPage';

function App() {
  const [tab, setTab] = useState<'voltcalc' | 'loancalc'>('loancalc');

  return (
    <AppShell activeTab={tab} onTabChange={setTab}>
      {tab === 'voltcalc' && <VoltCalcPage/>}
      {tab === 'loancalc' && <LoanCalcPage />}
    </AppShell>
  );
}

export default App;