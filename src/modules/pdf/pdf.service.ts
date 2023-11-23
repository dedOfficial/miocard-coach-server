import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as moment from 'moment';
import {
  ExportPdfCardio,
  ExportPdfCheckin,
  ExportPdfDrug,
  ExportPdfFood,
  ExportPdfHabit,
  ExportPdfMood,
  ExportPdfSymptom,
  ExportPdfWalkedDistance,
  ExportPdfRecommendation,
  ExportPdfWeight,
} from '../export/helpers/types';
import { StatTitlePdfExport } from './helpers/types';
import { sortFunction, sortFunctionCardio } from './helpers';

@Injectable()
export class PdfService {
  async generate(id: string, messages: any[]) {
    const generationDate = moment()
      .format('MMMM Do YYYY, h:mm:ss a')
      .toString();

    const pdfBuffer: Buffer = await new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        bufferPages: true,
      });

      doc.text(`Chat history for ${id}, generated ${generationDate}`, {
        underline: true,
      });
      doc.text('\n');
      doc.fontSize(14);
      for (const message of messages) {
        if (message.fromOperator) {
          doc.fillColor('blue').text(`${message.body}`, {
            align: 'right',
          });
          doc.fontSize(10);
          const createdDate = moment(message.createdAt)
            .format('MMMM Do YYYY, h:mm:ss a')
            .toString();
          doc.fillColor('blue').text(`${createdDate}`, {
            align: 'right',
          });
          doc.fontSize(14);
        } else {
          doc.fillColor('black').text(`${message.body}`);
          doc.fontSize(10);
          const createdDate = moment(message.createdAt)
            .format('MMMM Do YYYY, h:mm:ss a')
            .toString();
          doc.fillColor('black').text(`${createdDate}`);
          doc.fontSize(14);
        }
      }
      doc.end();

      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data);
      });
    });

    return pdfBuffer;
  }
  // TODO remove in this pilot
  async generateStats({
    id,
    stats,
  }: {
    id: string;
    stats: {
      /*food: ExportPdfFood[];*/
      drug: ExportPdfDrug[];
      symptom: ExportPdfSymptom[];
      weight: ExportPdfWeight[];
      cardio: ExportPdfCardio[];
      mood: ExportPdfMood[];
      /*walkedDistance: ExportPdfWalkedDistance[];*/
      habit: ExportPdfHabit[];
      checkin: ExportPdfCheckin[];
      recommendations: ExportPdfRecommendation[];
    };
  }) {
    const generationDate = moment()
      .format('MMMM Do YYYY, h:mm:ss a')
      .toString();

    const pdfBuffer: Buffer = await new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        bufferPages: true,
      });

      doc.text(`Stats for ${id}, generated ${generationDate}`, {
        underline: true,
        align: 'center',
      });
      doc.text('\n');

      // Cardio
      doc.text(StatTitlePdfExport.CARDIO, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const cardio of stats.cardio.sort(sortFunctionCardio)) {
        doc.text(`${cardio.day}: `, { continued: true });
        doc.text(`${cardio.timeOfDay || ''}: `, { continued: true });
        doc.text(`${cardio.pressure || 'N/A'}, ${cardio.pulse || 'N/A'}`);
      }
      doc.text('\n');

      // Weight
      doc.text(StatTitlePdfExport.WEIGHT, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const weight of stats.weight.sort(sortFunction)) {
        doc.text(`${weight.day}: `, { continued: true });
        doc.text(`${weight.weight || 'N/A'}`);
      }
      doc.text('\n');

      // Symptoms
      doc.text(StatTitlePdfExport.SYMPTOMS, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const symptom of stats.symptom.sort(sortFunction)) {
        if (typeof symptom.symptom === 'object') {
          if (symptom.symptom.isAbsent) {
            symptom.symptom = 'Symptoms are absent';
          } else {
            symptom.symptom = `${symptom.symptom.cardiovascular.join(', ')}, ${
              symptom.symptom.nonCardiovascular
            }`;
            symptom.symptom = symptom.symptom.replace(/,\s*$/, '');
          }
        }
        doc.text(`${symptom.day}: `, { continued: true });
        doc.text(`${symptom.symptom || 'N/A'}`);
      }
      doc.text('\n');

      // Drugs
      doc.text(StatTitlePdfExport.DRUGS, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const drug of stats.drug.sort(sortFunction)) {
        doc.text(`${drug.day}: `, { continued: true });
        doc.text(`${drug.drug || 'N/A'}`);
      }
      doc.text('\n');

      // Mood
      doc.text(StatTitlePdfExport.MOOD, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const mood of stats.mood.sort(sortFunction)) {
        doc.text(`${mood.day}: `, { continued: true });
        doc.text(`${mood.mood || 'N/A'}`);
      }
      doc.text('\n');
      // TODO remove in this pilot
      // Food
      /*doc.text(StatTitlePdfExport.FOOD, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const food of stats.food.sort(sortFunction)) {
        doc.text(`${food.day}: `, { continued: true });
        doc.text(`${food.food || 'N/A'}`);
      }
      doc.text('\n');*/
      // TODO remove in this pilot
      // Walked Distance
      /*doc.text(StatTitlePdfExport.WALKED_DISTANCE, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const walkedDistance of stats.walkedDistance.sort(sortFunction)) {
        doc.text(`${walkedDistance.day}: `, { continued: true });
        doc.text(`${walkedDistance.walkedDistance || 'N/A'}`);
      }*/

      // Habits
      doc.text(StatTitlePdfExport.HABITS, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const habit of stats.habit.sort(sortFunction)) {
        doc.text(`${habit.day}: `, { continued: true });
        doc.text(
          `${habit.habit || 'N/A'} ${
            habit.repeatability ? habit.repeatability + ' times' : ''
          }`,
        );
      }

      //checkin problems
      doc.text(StatTitlePdfExport.CHECKIN_PROBLEMS, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const checkin of stats.checkin.sort(sortFunction)) {
        if (Array.isArray(checkin.checkin)) {
          checkin.checkin = checkin.checkin.join('; ');
        }
        doc.text(`${checkin.day}: `, { continued: true });
        doc.text(`${checkin.checkin || 'N/A'}`);
      }
      doc.text('\n');

      // Recommendations
      doc.text(StatTitlePdfExport.RECOMMENDATIONS, {
        stroke: true,
        align: 'center',
        characterSpacing: 1,
      });
      doc.text('\n');

      for (const recommendation of stats.recommendations.sort(sortFunction)) {
        doc.text(`${recommendation.day}: `, { continued: true });
        doc.text(
          `${
            (recommendation.recommendationTitle &&
              recommendation.recommendationTitle + ': ') ||
            ''
          }${recommendation.repeatability || 'N/A'}`,
        );
      }
      doc.text('\n');

      doc.end();

      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data);
      });
    });

    return pdfBuffer;
  }
}
