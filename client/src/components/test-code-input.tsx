import React from 'react';

// Create a super simple test to see if the inputs render
function TestCodeInput() {
    const [code, setCode] = React.useState("");

    return (
        <div style={{ padding: '20px', border: '2px solid red' }}>
            <h2>Test: Should see 6 input boxes below</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                        key={index}
                        type="text"
                        maxLength={1}
                        style={{
                            width: '48px',
                            height: '56px',
                            textAlign: 'center',
                            fontSize: '24px',
                            border: '2px solid black'
                        }}
                    />
                ))}
            </div>
            <p>If you see 6 boxes, the problem is with CodeInput component logic</p>
            <p>If you don't see boxes, there's a CSS or rendering issue</p>
        </div>
    );
}

export default TestCodeInput;
