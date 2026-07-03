import React, { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Button, Form, Card, InputGroup, Spinner } from 'react-bootstrap'
import './App.css'

const API_BASE_URL = "http://127.0.0.1:8000"

const App = () => {
  // const [변수명, set변수명] = useState(초기값);
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef(null);

  async function handleSubmit(event) {
      event.preventDefault()
      if(input.trim() === "") {
        alert("질문을 입력해주세요.")
        return
      }


      // 1. 내가 입력한 메시지
      const userMessage = {
        role : "user",
        content : input,
      };

      //2. 화면에 출력
      setMessages((prev) => [
        ...prev,
        {
          role : "user",
          content : input
        }
      ])

      // 사용자가 보낸 대화까지 포함
      const currentMessages = [
        ...messages,
        {
          role : "user",
          content : input
        }
      ]

      setMessages(currentMessages);

      // 3. 서버요청
      try {
        setIsLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/chat`,{
            method : "POST",
            headers : {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message : input,
              messages: currentMessages,
            }),
        });

      if(!response.ok){
        throw new Error("서버 오류");
      }

      // 4. GTP답변 받기
      const data  = await response.json();

      if(!data.reply) {
        throw new Error("응답 형식 오류")
      }

      console.log(data)

      // 5. GPT 답변 추가
      setMessages((prev) => [
        ...prev,
        {
          role : "assistant",
          content : data.reply
        }
      ])


      } catch(error){
        console.log(error);
        setMessages((prev) => [
          ...prev,
          {
            role : "assistant",
            content : "⚠️ 서버와 통신할 수 없습니다."
          }
        ])
      } finally {
        setIsLoading(false)
      }

      setInput("")
  }

  function resetChat(){
    setMessages([]);
    setInput("");
  }

  function handleKeyDown(event){
    if(event.key === "Enter" && !event.shiftKey){
      event.preventDefault();
      handleSubmit(event)
    }
  }

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({behavior : "smooth"})
  }, [messages]);

  return (
    <>
      <Container fluid="md">
        <Row>
          <Col className='sidebar d-none d-md-block' xs={12} md={4}>
            <p className='mt-5 mb-3'>AI Customer Center</p>
            <h1 className='h2 mb-5'>하늘길 여행사</h1>
            <p className='mb-4'>예약 전 상담, 일정 변경, 환불 절차, 비자와 수하물 준비를 안내하는 여행사 챗봇입니다.</p>
            <Button variant="secondary" onClick={resetChat}>대화 초기화</Button>
          </Col>
          <Col xs={12} md={8} className='vh-100 d-flex flex-column'>
          <div>
            <h2 className='mt-5 mb-3'>여행 상담</h2>
            <p className='text-secondary'>예약 확정, 결제, 개인정보 확인은 직원 상담으로 연결됩니다.</p>
          </div>
          <div className='message'>
            {messages.map((message, index)=>(
              <div key={index}
                 className={`d-flex ${message.role === "user"
                    ? "justify-content-end"
                    : "justify-content-start"
                  }`}
              >
                <Card className='mt-2'
                  style={{maxWidth : "75%" }}
                  bg = {message.role === "user" ? "warning" : "light"}
                >
                  <Card.Body>
                    <Card.Text>
                      {message.content}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </div>

            ))}
            {isLoading && (
              <Card className='mt-2'>
                <Card.Body>
                  <Card.Text>
                    <Spinner
                        as="span"
                        animation="grow"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      답변을 생성하는 중...
                  </Card.Text>
                </Card.Body>
              </Card>
            )}
            <div ref={messageEndRef}></div>
          </div>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label className='d-flex justify-content-between align-items-center'><span>상담 내용을 입력하세요</span>
                <Button variant="secondary" onClick={resetChat}>대화 초기화</Button>
              </Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  aria-label="Example text with button addon"
                  aria-describedby="basic-addon1"
                  as='textarea'
                  value={input}
                  onChange={(event)=> setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button variant="outline-secondary"
                  id="button-addon1" type="submit">
                  {isLoading ? "전송중..." : "전송"}
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
