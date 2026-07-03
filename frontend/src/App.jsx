import React, {useState} from 'react'
import { Container, Row, Col, Button, Form, Card, InputGroup } from 'react-bootstrap'
import './App.css'

const API_BASE_URL = "http://127.0.0.1:8000"

const App = () => {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false);

 async function handleSubmit(event){
    event.preventDefault()
    if (input.trim() === "") return 

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: input,
          messages: [],
        }),
      });

    const data = await response.json();

    console.log(data);
    } catch(error) {
      console.log(error);
    }

    
    setMessages([
      ...messages, 
      {
        role: "user",
        content: input
      }
    ])
      
      setInput("")
    }
  
  return (
    <>
      <Container fluid="md">
        <Row>
          <Col
          className='sidebar d-none d-md-block' xs={12} md={4}>
            <p className='mt-5 mb-3' >AI Customer Center</p>
            <h1 className='h2 mb-5'>하늘길 여행사</h1>
            <p className='mb-4' >예약 전 상담, 일정 변경, 환불 절차, 비자와 수하물 준비를 안내하는 여행사 챗봇입니다.</p>
            <Button variant='secondary'>대화초기화</Button>          
          </Col>
          <Col xs={12} md={8} className='vh-100 d-flex 
          flex-column'>
          <div>
            <h2 className='h3 mt-5 mb-3'>여행 상담</h2>
            <p className='secondary'>예약 확정, 결제,개인정보 확인은 직원 상담으로 연결됩니다. </p>
          </div>
          <div className='message'>
            {messages.map((message, index) => (
              <Card className= 'mt-2' key={index}>
                <Card.Body>
                  <Card.Text>
                   {message.content}
                  </Card.Text>
                </Card.Body>
              </Card>
            ))}
          </div> 
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput11">
              <Form.Label>상담 내용을 입력하세요
                <Button variant='secondary'>대화초기화
                </Button>
              </Form.Label>
              <InputGroup className="mb-3">
        <Form.Control
          aria-label="Example text with button addon"
          aria-describedby="basic-addon1"
          as='textarea'
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <Button variant="secondary" id="button-addon1" type="submit">
          Button
        </Button>        
      </InputGroup>
            </Form.Group>
          </Form>         
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default App