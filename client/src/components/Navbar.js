// src/components/Navbar.js
import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';
import { toast } from 'react-toastify';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      toast.success('Başarıyla çıkış yapıldı!');
      navigate('/login');
    } catch (error) {
      toast.error('Çıkış yapılamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">Hava Aracı Üretim Sistemi</BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="navbar-nav" />
        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Ana Sayfa</Nav.Link>
            <Nav.Link as={Link} to="/parts">Parça Yönetimi</Nav.Link>
            <Nav.Link as={Link} to="/assembly">Uçak Montajı</Nav.Link>
            <Nav.Link as={Link} to="/inventory">Envanter</Nav.Link>
            <Nav.Link as={Link} to="/teams">Takımlar</Nav.Link>
          </Nav>
          <Nav>
            {user && (
              <div className="d-flex align-items-center">
                <span className="text-light me-3">
                  Merhaba, {user.username} | {user.team ? user.team.name : 'Takım Atanmamış'}
                </span>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Çıkış Yap
                </Button>
              </div>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;