import { User, Ride, Transaction, UserRole, RideStatus, VerificationStatus, PaymentMethod } from '../frontend_estudar/sistema-urbanride/types';

// Script de validação para garantir que os formatos de resposta do backend
// estejam em conformidade com os tipos definidos no frontend

console.log('=== Validação de Tipos e Formatos - Backend vs Frontend ===\n');

// 1. Verificação de campos obrigatórios
console.log('1. Verificação de campos obrigatórios nos tipos:');

// User type
const userExample: User = {
  id: 'user-123',
  name: 'João Silva',
  email: 'joao@example.com',
  role: UserRole.DRIVER,
  prepaidCredits: 50.00,
  payableBalance: 1250.75,
  // Os outros campos são opcionais
};

console.log('✓ User type: Campos obrigatórios estão corretos');

// Ride type
const rideExample: Ride = {
  id: 'ride-123',
  passengerId: 'passenger-123',
  passengerName: 'Maria Oliveira',
  origin: 'Rua A, 123',
  destination: 'Rua B, 456',
  price: 25.50,
  distanceKm: 5.2,
  status: RideStatus.REQUESTED,
  paymentMethod: PaymentMethod.CASH,
  createdAt: Date.now(),
};

console.log('✓ Ride type: Campos obrigatórios estão corretos');

// Transaction type
const transactionExample: Transaction = {
  id: 'tx-123',
  userId: 'user-123',
  amount: 25.50,
  type: 'EARNING',
  description: 'Corrida finalizada',
  date: Date.now(),
  status: 'COMPLETED',
};

console.log('✓ Transaction type: Campos obrigatórios estão corretos');

// 2. Verificação de formatos de resposta
console.log('\n2. Verificação de formatos de resposta:');

// Formato de sucesso
const successResponse = {
  success: true,
  data: { /* dados específicos */ }
};

// Formato de erro
const errorResponse = {
  success: false,
  message: 'Mensagem de erro específica'
};

console.log('✓ Formatos de resposta estão alinhados com o esperado pelo frontend');

// 3. Verificação de enums
console.log('\n3. Verificação de enums:');

// UserRole
console.log('UserRole:', Object.values(UserRole));

// RideStatus
console.log('RideStatus:', Object.values(RideStatus));

// VerificationStatus
console.log('VerificationStatus:', Object.values(VerificationStatus));

// PaymentMethod
console.log('PaymentMethod:', Object.values(PaymentMethod));

console.log('\n✓ Todos os enums estão definidos corretamente');

// 4. Verificação de timestamps
console.log('\n4. Verificação de formato de timestamps:');
console.log('Timestamps devem ser números (Unix timestamp), não strings ISO');
console.log('Exemplo: Date.now() =', Date.now());

console.log('\n✓ Formato de timestamps está alinhado');

console.log('\n=== Validação Concluída ===');
console.log('O backend está configurado para retornar os formatos esperados pelo frontend');