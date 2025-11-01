import axios from 'axios';
import { AUTH_BASE } from '@/config';


const authClient = axios.create({
    baseURL: AUTH_BASE,
    timeout: 10000,
});


export default authClient;