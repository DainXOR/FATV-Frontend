import React from 'react';
import FormCreator from '../Componentes/FormCreator';
import { useNavigate } from 'react-router-dom';

const FormCreatorPage = () => {
    const navigate = useNavigate();
    return <FormCreator onBack={() => navigate('/')} />;
};

export default FormCreatorPage;
