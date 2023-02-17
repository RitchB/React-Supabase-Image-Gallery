import logo from './logo.svg';
import { useState, useEffect } from 'react';
import './App.css';
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { v4 as uuidv4 } from 'uuid';

const CDNURL = "{supabaseUrl} + /storage/v1/object/public/ + {images-bucket_name} + "/"

function App() {
  const [email, setEmail] = useState('')
  const [images, setImages] = useState([])
  const user = useUser()
  const supabase = useSupabaseClient()
  console.log(email)

  async function getImages() {
    const { data, error } = await supabase
      .storage
      .from('images-bucket')
      .list(user?.id + "/", {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc"}
      });  
      
      // data: [ image1, image2, image3 ]
      // image1: { name: "image-name.png" }

      // to load image1: CDNURL.com/image-name.png -> hosted image

      if(data !== null) {
        setImages(data);
      } else {
        alert("Error loading images");
        console.log(error);
      }
  }

  useEffect(() => {
    if (user) {
      getImages()
    }
  }, [user])

  async function magicLinkLogin() {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email
    })

    if (error) {
      alert('Error dude. Fix that!')
      console.log(error)
    } else {
      alert('check your email for the magic link')
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
  }

  async function uploadImage(e) {
    let file = e.target.files[0]

    const { data, error } = await supabase
      .storage
      .from('images-bucket')
      .upload(user.id + "/" + uuidv4(), file)

    if (data) {
      getImages()
    } else {
      console.log('upload image error', error)
    }
  }

  async function deleteImage(imageName) {
    const { error } = await supabase
      .storage
      .from('images-bucket')
      .remove([ user.id + "/" + imageName])
    
    if(error) {
      alert(error);
    } else {
      getImages();
    }
  }

  return (
    <Container align="center" className='container-sm mt-4'>
      {user === null ?
        <>
          <h1>Welcome to theInvoiceBox</h1>
          <Form>
            <Form.Group className='mb-3' style={{ maxWidth: '500px' }}>
              <Form.Label>Enter email to sign in with magic link
                <Form.Control type="email" placeholder="Enter email" onChange={(e) => setEmail(e.target.value)} />
              </Form.Label>
            </Form.Group>
            <Button variant="primary" onClick={() => magicLinkLogin()}>Get Magic link</Button>
          </Form></>
        : <><h1>You're connected man!</h1>
          <Button onClick={() => signOut()}>Sign out</Button>
          <p>Current user : {user.email}</p>
          <p>Use the button file to upload an image to your gallery</p>
          <Form.Group className="mb-3" style={{ maxWidth: "500px" }}>
            <Form.Control type="file" accept="image/png, image/jpeg" onChange={(e) => uploadImage(e)} />
          </Form.Group>
          <hr />
          <h3>Your images</h3>
          {/* 
            to get an image : CDNURL + user.id + "/" + image.name
            images : [image1, image2, image3, ...]
          */}
          <Row xs={1} md={3} className="g-4">
            {images.map((image) => {
              return (
                <Col key={CDNURL + user.id + "/" + image.name}>
                  <Card>
                    <Card.Img variant="top" src={CDNURL + user.id + "/" + image.name} />
                    <Card.Body>
                      <Button variant="danger" onClick={() => deleteImage(image.name)}>Delete Image</Button>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}
          </Row>
        </>
      }
    </Container>
  );
}

export default App;
