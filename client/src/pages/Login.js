import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { login } from '../services/authService';
import { toast } from 'react-toastify';

import bayraktarLogo from '../assets/BaykarLogo.png';
import tb2Background from '../assets/baykar-bayraktar-tb2.png';

const validationSchema = Yup.object().shape({
  username: Yup.string()
    .required('Kullanıcı adı gereklidir')
    .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
  password: Yup.string()
    .required('Şifre gereklidir')
    .min(6, 'Şifre en az 6 karakter olmalıdır')
});

// Ana stil değişkenleri
const styles = {
  loginPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', // Değişiklik: Formu ortaya hizala (flex-end yerine center)
    background: `linear-gradient(rgba(30, 60, 114, 0.8), rgba(42, 82, 152, 0.8)), url(${tb2Background})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '3rem 0', // Değişiklik: Sağdaki ek boşluğu kaldırdık
  },
  card: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '500px', // Değişiklik: Daha geniş kart (450px → 500px)
    margin: '0 auto', // Değişiklik: Otomatik kenar boşluğu ile ortalama
    backdropFilter: 'blur(5px)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  cardBody: {
    padding: '3rem'
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '1.5rem'
  },
  logo: {
    width: '150px',
    height: 'auto',
    marginBottom: '1rem'
  },
  title: {
    color: '#243b6b',
    fontSize: '2rem',
    fontWeight: '700',
    marginTop: '0.5rem'
  },
  subtitle: {
    fontSize: '1.125rem',
    color: '#6c757d'
  },
  formLabel: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem'
  },
  formControl: {
    height: '58px',
    padding: '0.875rem 1.25rem',
    fontSize: '1.125rem',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb'
  },
  button: {
    height: '58px',
    fontSize: '1.125rem',
    fontWeight: '600',
    borderRadius: '10px',
    backgroundColor: '#2962ff',
    borderColor: '#2962ff',
    marginTop: '1.5rem',
    boxShadow: '0 4px 12px rgba(41, 98, 255, 0.2)'
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, rgba(220,220,220,0) 0%, rgba(220,220,220,1) 50%, rgba(220,220,220,0) 100%)',
    margin: '1.5rem 0'
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
    color: '#6c757d',
    fontSize: '0.875rem'
  }
};

const Login = ({ setUser }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (values, { setSubmitting }) => {
  setError('');
  setLoading(true);

  try {
    const user = await login(values.username, values.password);
    console.log("Login successful, user:", user);

    if (user) {
      setUser(user); // Kullanıcı durumunu ayarla
      toast.success('Giriş başarılı!');
      navigate('/'); // Başarılı giriş sonrası yönlendirme
    } else {
      setError('Giriş yapılamadı. Lütfen tekrar deneyin.');
    }
  } catch (error) {
    console.error("Login error:", error);

    if (error.response) {
      const status = error.response.status;
      if (status === 400) {
        setError('Giriş bilgileri hatalı. Lütfen kontrol ediniz.');
      } else if (status === 401 || status === 403) {
        setError('Erişim reddedildi. Kullanıcı adı veya şifre hatalı.');
      } else {
        setError('Giriş yapılamadı. Lütfen tekrar deneyin.');
      }
    } else if (error.request) {
      setError('Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.');
    } else {
      setError('Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  } finally {
    setLoading(false);
    setSubmitting(false);
  }
};


  return (
    <div style={styles.loginPage}>
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={7} xl={6}> {/* Değişiklik: Sütun genişliklerini artırdık */}
            <Card style={styles.card}>
              <Card.Body style={styles.cardBody}>
                <div style={styles.logoContainer}>
                  <img src={bayraktarLogo} alt="Bayraktar Logo" style={styles.logo} />
                  <h1 style={styles.title}>Hava Aracı Üretim Sistemi</h1>
                  <p style={styles.subtitle}>Personel Girişi</p>
                </div>

                <div style={styles.divider}></div>

                {error && (
                  <Alert variant="danger" className="text-center py-3 mb-4">
                    {error}
                  </Alert>
                )}

                <Formik
                  initialValues={{ username: '', password: '' }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    isSubmitting
                  }) => (
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label style={styles.formLabel}>Kullanıcı Adı</Form.Label>
                        <Form.Control
                          type="text"
                          name="username"
                          value={values.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.username && errors.username}
                          placeholder="Kullanıcı adınızı girin"
                          style={styles.formControl}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.username}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label style={styles.formLabel}>Şifre</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.password && errors.password}
                          placeholder="Şifrenizi girin"
                          style={styles.formControl}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100"
                        style={styles.button}
                        disabled={isSubmitting || loading}
                      >
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                      </Button>
                    </Form>
                  )}
                </Formik>

                <div style={styles.footer}>
                  © {new Date().getFullYear()} - Hava Aracı Üretim Sistemi
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;